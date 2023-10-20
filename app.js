// Imports
const express = require('express')
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const app = express()
const port = 5000

const { loadExcelAsArray, conditionalFetchCell2, twoConditionalFetchCell2, conditionalFetchRow2, insertRowIntoCSV, insertRowIntoCSVWithId } = require('./data')
const {  addDescription, scoreAndSave } = require('./processor')

// Init
const cat = {
    0: {
        'label': 'Latent',
        'color': 'var(--dark-red)',
        'color2': 'RGB(255, 162, 146, 0.6)'
    },
    1: {
        'label': 'Emerging',
        'color': 'var(--dark-yellow)',
        'color2': 'RGB(255, 237, 94, 0.6)'
    },
    2: {
        'label': 'Mature',
        'color': 'var(--dark-green)',
        'color2': 'RGB(0, 220, 36, 0.6)'
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

app.listen(port, () => console.info(`App listening on port ${port}`))

// Navigation
app.get('', async (req, res) => {
    res.render('pages/index')
})
app.get('/contact', (req, res) => {
    res.render('pages/contact')
})
app.get('/survey/:module', (req, res) => {      
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
    res.render('pages/start_survey', { module: module, desc: desc})
})

app.post('/survey/:module/start', async (req, res) => {
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
            else if (q == 'engaged_in_ce_explained') {
                userData['engaged_in_ce_explained'] = req.body['engaged_in_ce_explained']
            }
            // Get answers
            else {
                data[q] = JSON.parse(req.body[q]);          
            }
        }

        // Concatenate name
        userData['name'] = firstName + ' ' + lastName

        // Write user data
        let userInsert; 

        insertRowIntoCSVWithId('./data/result/user.csv', userData)
            .then(id => {
                userInsert = id;
            })
            .catch(error => console.error(error));

        // Fetch modules
        let params = req.params.module.replaceAll('_', ' ');
        
        // Load modules
        let module = await loadExcelAsArray('./data/modules.xlsx', 'modules')
        module = module.filter(function(m) {return m.name.toLowerCase() == params})[0]

        // Load questions
        let questions = await loadExcelAsArray('./data/modules.xlsx', 'questions')     
        questions = questions.filter(function(q) {return module['id'].includes(q.module)}) 

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

        res.render('pages/survey', { module:module, data: questions, userId: userInsert})
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred.');
    }
});

app.post('/result/market_creation_and_organisational_change', async (req, res) => {
    // Load data
    let questionsModules = await loadExcelAsArray('./data/modules.xlsx', 'questions')
    let subquestionsModules = await loadExcelAsArray('./data/modules.xlsx', 'sub_questions')
    questionsModules.push(...subquestionsModules)

    // Init variables
    let modules = {
        'm2': { id: 'm2', name: 'Market Creation', code: 'mc' },
        'm3': { id: 'm3', name: 'Organisational Change', code: 'oc' }
    };
    let data = {
        'm2': {}, 'm3': {}
    };
    let userId = {};
    let scores = {};
    
    // Parse through request form
    for (const q in req.body) {  
        
        // Get user data
        if (q == 'userId') {            
            userId = req.body[q];
        }
        // Get answers
        else if (q.startsWith('q') || q.startsWith('sq')) {            
            
            // Get question's module
            let m = conditionalFetchCell2(questionsModules, 'id', q.toString(), 'module')            
            
            // Assign to specific modules
            if (data[m]){
                data[m][q] = JSON.parse(req.body[q])
            }   
        }
    }  

    // Loop through modules
    for (let m in modules) { 

        // Evaluate module scores
        scores[modules[m].code] = await scoreAndSave(modules[m],data[m],userId);
        scores[modules[m].code] = await addDescription(scores[modules[m].code])

    }

    console.log('modules is ')
    console.log(modules)
    console.log('data is')
    console.log(data)
    console.log('scores is')
    console.log(scores['mc'])
    console.log(scores['oc'])

    // Get overall result
    let overall_results = await loadExcelAsArray('./data/scoring.xlsx', 'final_result')
    let overall_results_desc = await loadExcelAsArray('./data/scoring.xlsx', 'overall_result_desc')
    console.log(overall_results_desc)
    let mc_result = scores.mc.mScore.label;
    let oc_result = scores.oc.mScore.label;    
    let business_category = {}
    business_category = {}
    business_category.category = await twoConditionalFetchCell2(overall_results, 'mc', mc_result, 'oc', oc_result, 'business_categories');
    business_category.desc = await conditionalFetchCell2(overall_results_desc, 'type', business_category.category, 'desc');    
    business_category.improvements = await conditionalFetchCell2(overall_results_desc, 'type', business_category.category, 'improvements');
    
    console.log('business cat is');
    console.log(business_category)
    
    
    // Insert to overall
    await insertRowIntoCSV('./data/result/market_creation_and_organisational_change.csv', {
        'user_id': userId,
        'mc_result': mc_result,
        'oc_result': oc_result,
        'business_category': business_category.category
    })

    res.render(
        'pages/result/result_all', 
        { modules: modules, data: data, scores: scores, business_category:business_category, cat:cat}
    )
})

app.post('/result', async (req, res) => {
    // Init variables
    console.log(req.body)
    let module;
    let result;
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
    scores = await addDescription(scores)

    console.log('modules is ')
    console.log(module)
    console.log('userid is ')
    console.log(userId)
    console.log('data is')
    console.log(data)
    console.log('scores is')
    console.log(scores)
    
    res.render('pages/result/result_module', { module: module, data: data, scores: scores, cat: cat})
})

// Get csv result
app.get('/downloadCSV', (req, res) => {
    const zip = archiver('zip'); // Create a new zip archive

    // Add files to the zip archive
    const files = [
        {
            filePath: path.join(__dirname, './data/result/user.csv'),
            fileName: 'user.csv'
        },
        {
            filePath: path.join(__dirname, './data/result/enabling_environment.csv'),
            fileName: 'enabling_environment.csv'
        },
        {
            filePath: path.join(__dirname, './data/result/market_creation.csv'),
            fileName: 'market_creation.csv'
        },
        {
            filePath: path.join(__dirname, './data/result/organisational_change.csv'),
            fileName: 'organisational_change.csv'
        },
        {
            filePath: path.join(__dirname, './data/result/market_creation_and_organisational_change.csv'),
            fileName: 'market_creation_and_organisational_change.csv'
        }
    ];

    // Pipe the zip archive to the response object
    zip.pipe(res);

    // Add each file to the zip archive
    files.forEach(file => {
        if (fs.existsSync(file.filePath)) {
            zip.append(fs.createReadStream(file.filePath), { name: file.fileName });
        }
    });

    // Finalize the zip archive
    zip.finalize();

    // Handle errors during zip finalization
    zip.on('error', err => {
        console.error('Error finalizing zip archive:', err);
        res.status(500).send('Internal Server Error');
    });
})
  