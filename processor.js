const { loadExcelAsArray, conditionalFetchCell2, insertRowIntoCSV } = require('./data')

const addDescription = async(scores) => {
    // Get result desc
    const cat = await loadExcelAsArray('./data/scoring.xlsx', 'category_score')
    const desc = await loadExcelAsArray('./data/scoring.xlsx', 'result_desc')

    // Get desc for questions
    for (q in scores.qScores) {
        // Get question cat
        let qCat = await conditionalFetchCell2(cat, 'score', scores.qScores[q]['label'], 'category')

        // Get info on label
        scores.qScores[q]['desc'] = await conditionalFetchCell2(desc, 'artifact', q, `${qCat.toLowerCase()}_desc`)
        scores.qScores[q]['improvements'] = await conditionalFetchCell2(desc, 'artifact', q, `${qCat.toLowerCase()}_improvements`)
    }

    // Get desc for module
    console.log(scores)
    let mCat = await conditionalFetchCell2(cat, 'score', scores.mScore.label, 'category')
    scores.mScore['desc'] = await conditionalFetchCell2(desc, 'artifact', scores.mScore.module.id, `${mCat.toLowerCase()}_desc`)
    scores.mScore['improvements'] = await conditionalFetchCell2(desc, 'artifact', scores.mScore.module.id, `${mCat.toLowerCase()}_improvements`)

    return scores;
}

const scoreAndSave = async(module, data, userId) => {    
    // Calculate question score
    let qScores = await calculateQScores(data, module);
    
    // Calculate module scores
    let mScore = await calculateMScore(module, qScores)

    // Get insert row
    let insertRow = await insertResult(userId, module, data, qScores, mScore);    

    console.log('insert row is')
    console.log(insertRow)

    return {qScores, mScore};
}

const calculateMScore = async (module, qScores) => {
    // Fetch data
    let moduleSheet =  module.name.replace(' ', '_').toLowerCase()
    const scoring = await loadExcelAsArray('./data/scoring.xlsx', moduleSheet)

    // Get module score and save
    let moduleScore = 0;

    // Aggregste question score
    for (q in qScores) {
        moduleScore += qScores[q].label;
    }
  
    // Get label from score
    return {
        module: module,
        score: moduleScore,
        maxScore: conditionalFetchCell2(scoring, 'id', 1, 'score_values'),
        label: await conditionalFetchCell2(scoring, 'score_values', moduleScore, 'label')
    }
    
}


const insertResult = async (userId, module, answers, qScores, mScore ) => {
    // Init row
    let moduleSheet =  module.name.replace(' ', '_').toLowerCase()
    let insertRow = {};
  
    
    // Add user data
    insertRow['user_id'] = userId;  
    
    // Get anwers
    for (const a in answers) {        
        // Assign to json object
        insertRow[a] = answers[a].option;
    }      
    
    // Assign module score
    insertRow[`${module.code}_result`] = mScore.label;   

    // Insert to result excel
    insertRowIntoCSV(`./data/result/${moduleSheet}.csv`, insertRow)

    return insertRow 
}

const calculateQScores = async (answers, module) => {
    // Init result
    let result = {};
    let moduleSheet =  module.name.replace(' ', '_').toLowerCase()

    // Fetch data
    const score_ranges = await loadExcelAsArray('./data/scoring.xlsx', 'question_scores_range')

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
        let topic = await conditionalFetchCell2(score_ranges, 'question', q, 'topic')        
        result[q]['topic'] = topic;

        // Get maximum score
        let maxScore = await conditionalFetchCell2(score_ranges, 'question', q, 'max_score')
        result[q]['maxScore'] = maxScore + 1 // Count '0'

        // Get lem score
        let lemRange = await conditionalFetchCell2(score_ranges, 'question', q, 'lem_range')
        lemRange = lemRange.split(',')

        // Assign portion to score
        result[q]['latent'] = parseInt(lemRange[0]) + 1 // '0' is not counted
        result[q]['emerging'] = parseInt(lemRange[1])  - parseInt(lemRange[0])
        result[q]['mature'] = parseInt(lemRange[2])  - parseInt(lemRange[1])

        // Get score label / classification
        let label = await conditionalFetchCell2(score_ranges, 'question', q, result[q]['score'])
        result[q]['label'] = label   
    }    

    return result;
}


module.exports = {
    addDescription,
    scoreAndSave,
    calculateMScore,
    insertResult,
    calculateQScores
  }