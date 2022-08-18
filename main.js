const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
let today = new Date()
let todayFormatted = today.toLocaleDateString("fr-FR", options);
let working = false;
let started = false;
let phases = [];

let button = document.getElementById("toggle");
let hour = document.getElementById("hour");

button.innerHTML = (working) ? "Pause" : "Work";
document.getElementById("today").innerText = todayFormatted;
hour.innerHTML = today.toLocaleTimeString("fr-FR", { hour: '2-digit',minute: '2-digit'});


button.addEventListener('click', () => {

    

    working = !working;

    button.innerHTML = (working) ? "Pause" : "Work";
    
})
