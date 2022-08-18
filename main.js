const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
let today = new Date()
let todayFormatted = today.toLocaleDateString("fr-FR", options);
let working = false;
let started = false;
let phases = [];
let currentPhase;
let button = document.getElementById("toggle");
let hour = document.getElementById("hour");

button.innerHTML = (working) ? "Pause" : "Work";
document.getElementById("today").innerText = todayFormatted;
hour.innerHTML = today.toLocaleTimeString("fr-FR", { hour: '2-digit',minute: '2-digit'});


button.addEventListener('click', () => {

    if(!started){
        started = true;
    }
    else {
        let end = Date.now();
        currentPhase = {...currentPhase, end, duration: end - currentPhase.start}
        phases.push(currentPhase);
        currentPhase = null;
    }
    currentPhase = {
        type: (working) ? "Break" : "Work",
        start: Date.now(),
    }
    working = !working;

    button.innerHTML = (working) ? "Pause" : "Work";
    console.log(phases)
})
