module.export = function initQuestion(questionText) {
  
    // Create the question text paragraph
    const questionParagraph = document.createElement("p");
    questionParagraph.className = "text-gray-800 mb-4";
    questionParagraph.textContent = questionText;
    return questionParagraph;
  }
  

module.export = function createRadioLabel(name, id, label) {
  const radioOptionLabel = document.createElement("label");
  radioOptionLabel.setAttribute("for", id);
  radioOptionLabel.className = "inline-flex items-center";

  const radioOptionInput = document.createElement("input");
  radioOptionInput.type = "radio";
  radioOptionInput.id = id;
  radioOptionInput.name = name;
  radioOptionInput.className =
    "h-6 w-6 text-blue-600 rounded-full focus:ring-2 focus:ring-blue-400";

  const radioOptionText = document.createElement("span");
  radioOptionText.className = "ml-2";
  radioOptionText.textContent = label;

  radioOptionLabel.appendChild(radioOptionInput);
  radioOptionLabel.appendChild(radioOptionText);

  return radioOptionLabel
}

window.onload = () => {
  console.log('page is loaded');

  // Create the main container div
  const containerDiv = document.createElement("div");
  containerDiv.className = "bg-gray-200 rounded-full p-4";
  
  // Create question
  var radioContainerDiv = initQuestionBox("This is your question text?");

  // Create the radio buttons container div
  const radioContainerDiv = document.createElement("div");
  radioContainerDiv.className = "flex items-center space-x-4";

  // For each option
  var radioOption1Label = createRadioLabel("radioOptions", "radioOption1", "Option 1")
  radioContainerDiv.appendChild(radioOption1Label);

  var radioOption2Label = createRadioLabel("radioOptions", "radioOption2", "Option 2")
  radioContainerDiv.appendChild(radioOption2Label);
  
    // Append elements to the main container div
    containerDiv.appendChild(questionParagraph);
    containerDiv.appendChild(radioContainerDiv);
  
    // Append the container div to the document body (you can change this as needed)
    document.body.appendChild(containerDiv);
}
