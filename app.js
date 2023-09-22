// Imports
const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 5000
const path = require('path');

const { conditionalFetchCell, jsonConditionalFetchCell, conditionalFetchRows, conditionalFetchRow, postModuleResult, insertRowToExcel, twoConditionalFetchCell } = require('./data')

// Init
const cat = {
    0: {
        'label': 'Latent',
        'color': '#FF7456',
        'color2': '#FFBEB0'
    },
    1: {
        'label': 'Emerging',
        'color': '#FFE37E',
        'color2': '#FFF1C1'
    },
    2: {
        'label': 'Mature',
        'color': '#14DE9B',
        'color2': '#BEFFC5'
    }
}

// Use body-parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Static Files
app.use(express.static('public'));
// Specific folder example
// app.use('/css', express.static(__dirname + 'public/css'))
// app.use('/js', express.static(__dirname + 'public/js'))
// app.use('/img', express.static(__dirname + 'public/images'))

// Set View's
app.set('views', './views');
app.set('view engine', 'ejs');

// Navigation
// 1. Home 
app.get('', async (req, res) => {
    res.render('pages/index', { text: 'Hey' })
})
// 2. About 
app.get('/about', (req, res) => {
    res.render('pages/about', { text: 'Hey' })
})
// 3. Quiz: Enabling Environment, Market Creation, Organisational Change
app.get('/quiz', (req, res) => {  
    res.render('pages/quiz', { data: [...data.mc, ...data.oc], module:'market_creation,organisational_change'})
})
app.get('/quiz/:module', (req, res) => {      
    // Get module data
    res.render('pages/start_quiz', { module: req.params.module })
})
app.post('/quiz/:module/start', async (req, res) => {
    try {
        // Init
        let questions = [];
        let modules = [];
        let data = {};
        let userData = {};

        // Init name
        let firstName = '';
        let lastName = '';

        // Fetch user data
        for (const q in req.body) {
            // Get data
            if (q == 'first-name') {
                firstName = req.body['first-name']            
            }
            else if (q == 'last-name') {
                lastName = req.body['last-name']
            }
            else if (q == 'email-address') {
                userData['email'] = req.body['email-address']
            }
            else if (q == 'org-name') {
                userData['org_name'] = req.body['org-name']
            }
            else if (q == 'org-type') {
                userData['org_type'] = req.body['org-type']
            }
            // Get answers
            else {
                data[q] = JSON.parse(req.body[q]);          
            }
        }

        // Get name
        userData['name'] = firstName + ' ' + lastName

        // Fetch modules
        let params = req.params.module.replace('_', ' ');

        // If all is requested
        if (params == 'all') {
            // Fetch MC and OC
            modules.push(await conditionalFetchRow('./data/modules.xlsx', 'modules', 'code', 'mc'))
            modules.push(await conditionalFetchRow('./data/modules.xlsx', 'modules', 'code', 'oc'))
        }
        // If specific is requested
        else {
            modules.push(await conditionalFetchRow('./data/modules.xlsx', 'modules', 'name', params))
        }
        
        // For each module
        await Promise.all(modules.map(async m => {
            // Fetch questions of the module
            let mQuestions = await conditionalFetchRows('./data/modules.xlsx', 'questions', 'module', `${m.id}`);

            // Fetch sub questions
            for (let i = 0; i < mQuestions.length; i++) {
                // Tag with module id
                mQuestions[i]['module'] = m.id;
                // Get options
                mQuestions[i]['q_options'] = await conditionalFetchRows('./data/modules.xlsx', 'q_options', 'question', `${mQuestions[i].id}`);
                // Get subquestions
                mQuestions[i]['sub_questions'] = await conditionalFetchRows('./data/modules.xlsx', 'sub_questions', 'question', `${mQuestions[i].id}`);
                // Get subquestions options
                mQuestions[i]['sq_options'] = await conditionalFetchRows('./data/modules.xlsx', 'sq_options', 'question', `${mQuestions[i].id}`);
            }

            // Append to questions bank
            return mQuestions;
        })).then((results) => {
            // Flatten the array of arrays
            questions = results.flat(); 
        });        

        res.render('pages/quiz', { modules:modules, data: questions, userData:userData })
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred.');
    }
});

app.post('/result/all', async (req, res) => {
    // Init variables    
    let modules = {};
    let data = {};
    let userData = {};
    let scores = {};
    
    // Parse through request form
    for (const q in req.body) {
        // Get module
        if (q == 'modules') {
            let mArray = JSON.parse(req.body[q]);
            mArray.forEach(m => {
                modules[m.id] = m
            });
        }
        // Get user data
        else if (q == 'userData') {               
            userData = JSON.parse(req.body[q])
        }
        // Get answers
        else {
            data[q] = JSON.parse(req.body[q]);          
        }
    }  

    // Loop through modules
    for (const m in modules) { 

        // Get module questions
        let mData = {};
        for (const d in data) {
            // Get question module
            let q = data[d].question
            let qMod = await conditionalFetchCell('./data/modules.xlsx', 'questions', 'id', q, 'module')

            // Check question module
            if (qMod == modules[m].id) {
                // Append
                mData[d] = data[d];
            }
        }

        // Evaluate module scores
        scores[modules[m].code] = await scoreAndSave(modules[m],mData,userData);
    }

    console.log('modules is ')
    console.log(modules)
    console.log('data is')
    console.log(data)
    console.log('scores is')
    console.log(scores.mc.qScores)

    // Get overall result
    let mc_result = scores.mc.mScore;
    let oc_result = scores.oc.mScore;
    let business_category = await twoConditionalFetchCell('./data/scoring.xlsx', 'final_result', 'mc', mc_result, 'oc', oc_result, 'business_categories')
    
    // Insert to overall
    insertRowToExcel('./data/result.xlsx', 'all', {
        ...userData,
        'mc_result': mc_result,
        'oc_result': oc_result,
        'business_category': business_category
    }) 


    console.log('business category is')
    console.log(business_category)

    res.render('pages/result_all', { modules: modules, data: data, scores: scores, business_category:business_category, cat:cat})
})

app.post('/result', async (req, res) => {
    // Init variables
    let module;
    let data = {};
    let scores = {};
    let userData = {};
    
    // Parse through request form
    for (const q in req.body) {
        // Get module
        if (q == 'modules') {            
            module = JSON.parse(req.body[q])[0];
        }
        // Get user data
        else if (q == 'userData') {   
            userData = JSON.parse(req.body[q])
        }
        // Get answers
        else {
            data[q] = JSON.parse(req.body[q]);          
        }
    }       

    scores = await scoreAndSave(module,data, userData);

    console.log('modules is ')
    console.log(module)
    console.log('data is')
    console.log(data)
    console.log('scores is')
    console.log(scores)
    
    res.render('pages/result_module', { module: module, data: data, scores: scores, cat: cat})
})
// Get csv result
app.get('/result/excel', (req,res) => {
    console.log(req)
    const filePath = path.join(__dirname, 'data', 'result.xlsx');

    // Send the file as a response
  res.sendFile(filePath, (err) => {
    if (err) {
        // Handle errors, such as the file not existing
        console.error(err);
        res.status(err.status || 500).send('File not found');
    } else {
        console.log('File sent successfully')        
    }
  });
});
// Test page
app.get('/test', (req, res) => {
    res.render('test3', { text: 'Hey' })
})
app.get('/test2', (req, res) => {
    res.render('test2', { text: 'Hey' })
})
app.get('/test4', (req, res) => {
    res.render('test4', { text: 'Hey' })
})

app.listen(port, () => console.info(`App listening on port ${port}`))



const scoreAndSave = async(module, data, userData) => {
    // Calculate question score
    let qScores = await calculateQScores(data);        
    
    // Get sheetname        
    let moduleSheet =  module.name.replace(' ', '_').toLowerCase()

    // Get insert row
    let insertRow = await getInsertRow(module, data, qScores);

    // Add user data
    for (ud in userData) {
        insertRow[ud] = userData[ud];
    }

    // Get module details 
    console.log(insertRow[`${module.code}_result`])
    let mScore = insertRow[`${module.code}_result`]

    console.log('insert row is')
    console.log(insertRow)

    // Insert to result excel
    insertRowToExcel('./data/result.xlsx', moduleSheet, insertRow) 
    

    return {qScores, mScore};
}


const getInsertRow = async (module, answers, qScores ) => {    
    // Init row
    let moduleSheet =  module.name.replace(' ', '_').toLowerCase()
    let insertRow = {};

    // Get anwers
    for (const a in answers) {        
        // Assign to json object
        insertRow[a] = answers[a].option;
    }      

    // Get module score and save
    let moduleScore = 0;

    // Aggregste question score
    for (q in qScores) {
        moduleScore += qScores[q].label;
    }
  
    // Get label from score
    insertRow[`${module.code}_result`] = await conditionalFetchCell('./data/scoring.xlsx', moduleSheet.toString(), 'score_values', moduleScore.toString(), 'label');      

    return insertRow 
}

const calculateQScores = async (answers) => {
    // Init result
    let result = {};

    // Loop through answers
    for (const q in answers) {
        // Count score
        let qid =answers[q].question
        if (result.hasOwnProperty(qid)) {
            // Aggregate
            result[qid]['score'] += answers[q].score
        }
        else {
            // Initiate
            result[qid] = {};
            result[qid]['score'] = 0;
        }        
    }

    // Add info to scores
    for (q in result) {
        // Get topic
        let topic = await conditionalFetchCell('./data/scoring.xlsx', 'question_scores_range', 'question', q, 'topic');
        result[q]['topic'] = topic;

        // Get maximum score
        let maxScore = await conditionalFetchCell('./data/scoring.xlsx', 'question_scores_range', 'question', q, 'max_score')
        result[q]['maxScore'] = maxScore + 1 // Count '0'

        // Get lem score
        let lemRange = await conditionalFetchCell('./data/scoring.xlsx', 'question_scores_range', 'question', q, 'lem_range')
        lemRange = lemRange.split(',')

        // Assign portion to score
        result[q]['latent'] = parseInt(lemRange[0]) + 1 // '0' is not counted
        result[q]['emerging'] = parseInt(lemRange[1])  - parseInt(lemRange[0])
        result[q]['mature'] = parseInt(lemRange[2])  - parseInt(lemRange[1])

        // Get score label / classification
        let label = await conditionalFetchCell('./data/scoring.xlsx', 'question_scores_range', 'question', q, result[q]['score'])
        result[q]['label'] = label   
    }    

    return result;
}