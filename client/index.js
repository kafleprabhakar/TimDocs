window.onload = async function() {
    const response = await fetch("http://localhost:3000");
    const jsonData = await response.json();
    console.log(jsonData);
    var editor = CodeMirror.fromTextArea
    document.getElementById('editor').mode = "xml"
    document.getElementById('editor').theme = "dracula"
}; 