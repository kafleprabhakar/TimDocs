window.onload = async function() {
    const response = await fetch("http://localhost:3000");
    const jsonData = await response.json();
    console.log(jsonData);
    document.getElementById('dummy-p').innerHTML = JSON.stringify(jsonData);
};