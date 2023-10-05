// Imports
const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 5000
const path = require('path');

const { loadExcelAsArray, conditionalFetchCell2, conditionalFetchRow2, conditionalFetchCell, jsonConditionalFetchCell, conditionalFetchRows, conditionalFetchRow, postModuleResult, insertRowToExcel, twoConditionalFetchCell } = require('./data')

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
    const data = await loadExcelAsArray('./data/modules.xlsx', 'modules')
    const result = await conditionalFetchCell2(data, 'name', 'Enabling Environment', 'code')
    const row = await conditionalFetchRow2(data, 'name', 'Enabling Environment', 'code')
    console.log(row)
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
    let module = req.params.module;
    let desc = '';

    // Define desc
    switch(module) {
        case 'enabling_environment':
            desc = 'Assess the broader factors and conditions that support or hinder the transition to a circular economy, such as policies, regulations, and funding.'
            break;
        case 'market_creation':
            desc = 'Evaluate the strategies and actions needed to develop vibrant markets for circular economy products and services'
            break;
        case 'organisational_change':
            desc = 'Assess the processes and transformations your organisation requires to embrace and implement circular economy principles effectively.'
            break;
        case 'market_creation_and_organisational_change':
            desc = 'Dive deeper for a bespoke assessment of the essential synergy between transforming internal processes and creating external markets to drive circular economy adoption within your organisation.'
            break;
    }

    // Get module data
    res.render('pages/start_quiz', { module: module, desc: desc})
})

app.post('/quiz/:module/start', async (req, res) => {
    try {    
        // Init user data
        let userData = {};

        // Fetch user data
        for (const q in req.body) {
            // Get data
            if (q == 'first_name') {
                firstName = req.body['first_name']            
            }
            else if (q == 'last_name') {
                lastName = req.body['last_name']
            }
            else if (q == 'org_name') {
                userData['org_name'] = req.body['org_name']
            }
            else if (q == 'industry') {
                userData['industry'] = req.body['industry']
            }
            else if (q == 'job_title') {
                userData['job_title'] = req.body['job_title']
            }
            else if (q == 'email') {
                userData['email'] = req.body['email']
            }
            else if (q == 'years_of_experience') {
                userData['years_of_experience'] = req.body['years_of_experience']
            }            
            else if (q == 'goal') {
                userData['goal'] = req.body['goal']
            }
            else if (q == 'reason_of_use') {
                userData['reason_of_use'] = req.body['reason_of_use']
            }
            else if (q == 'hear_about_us') {
                userData['hear_about_us'] = req.body['hear_about_us']
            }
            else if (q == 'enganged_in_ce') {
                userData['enganged_in_ce'] = req.body['enganged_in_ce']
            }
            else if (q == 'comments') {
                userData['comments'] = req.body['comments']
            }
            // Get answers
            else {
                data[q] = JSON.parse(req.body[q]);          
            }
        }

        // Concatenate name
        userData['name'] = firstName + ' ' + lastName

        // Write user data
        let userInsert = await insertRowToExcel('./data/result.xlsx', 'user', userData)

        // Fetch modules
        let params = req.params.module.replaceAll('_', ' ');
        
        // Load modules
        let module = await loadExcelAsArray('./data/modules.xlsx', 'modules')
        module = module.filter(function(m) {return m.name.toLowerCase() == params})[0]


        // Load questions
        let questions = await loadExcelAsArray('./data/modules.xlsx', 'questions')     
        questions = questions.filter(function(q) {return module['id'].includes(q.module)}) 

        console.log(questions)

        // Load question attr
        let sub_questions = await loadExcelAsArray('./data/modules.xlsx', 'sub_questions')
        let qOptions = await loadExcelAsArray('./data/modules.xlsx', 'q_options')
        let sqOptions = await loadExcelAsArray('./data/modules.xlsx', 'sq_options')

        // Include into q
        for (let i = 0; i < questions.length; i++) {
            // subquestions
            questions[i]['sub_questions'] = sub_questions.filter(function(sq) {return sq.question == questions[i].id})
            // q options
            questions[i]['q_options'] = qOptions.filter(function(o) {return o.question == questions[i].id})            
            // sq options
            questions[i]['sq_options'] = sqOptions.filter(function(o) {return o.question == questions[i].id})
        }

        res.render('pages/quiz', { module:module, data: questions, userId: userInsert})
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred.');
    }
});

app.post('/result/market_creation_and_organisational_change', async (req, res) => {
    // Init variables    
    let modules = {};
    let data = {};
    let userData = {};
    let scores = {};
    
    // Parse through request form
    for (const q in req.body) {
        // Get module
        if (q == 'module') {
            let module = JSON.parse(req.body[q]);            
            modules['m2'] = { id: 'm2', name: 'Market Creation', code: 'mc' }
            modules['m3'] = { id: 'm3', name: 'Organisational Change', code: 'oc' }
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
    console.log(req.body)
    let module;
    let data = {};
    let scores = {};
    let userId = {};
    
    // Parse through request form
    for (const q in req.body) {
        // Get module
        if (q == 'module') {            
            module = JSON.parse(req.body[q]);
        }
        else if (q == 'userId') {            
            userId = req.body[q];
        }
        else {
            data[q] = JSON.parse(req.body[q]);          
        }
    }       

    scores = await scoreAndSave(module, data, userId);

    console.log('modules is ')
    console.log(module)
    console.log('userid is ')
    console.log(userId)
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
    // Get sheetname        
    let moduleSheet =  module.name.replace(' ', '_').toLowerCase()

    // Load scores
    const scoring = loadExcelAsArray('./data/scoring.xlsx', moduleSheet)

    // Calculate question score
    let qScores = await calculateQScores(data, scoring);       

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

const calculateQScores = async (answers, scoring) => {
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