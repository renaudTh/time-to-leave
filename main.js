class TimeTracker {

    constructor(storageKey, dayDuration) {

        this.debt = -dayDuration;
        this.storageKey = storageKey;
        this.dayDuration = dayDuration;
        this.startTime = Date.now();
        this.phases = [];
    }

    static newFromJson(json) {
        let timeTrack = new TimeTracker();

        timeTrack.storageKey = json.storageKey;
        timeTrack.dayDuration = json.dayDuration;
        timeTrack.startTime = json.startTime;
        timeTrack.phases = json.phases;
        timeTrack.debt = json.debt;

        return timeTrack;
    }

    addPhase(phase) {
        this.phases.push(phase);
    }

    static get(storageKey) {
        return JSON.parse(localStorage.getItem(storageKey));
    }
    getLastPhase() {
        return this.phases.pop();
    }
    getLastPhaseType() {
        if(this.phases.length == 0) return null;
        return this.phases[this.phases.length - 1].type;
    }
    store() {
        localStorage.setItem("timeTracker", JSON.stringify(this));
    }
    getDebt(){
        return this.debt;
    }
    getEstimatedTimeToLeave(){
        return this.startTime - this.debt;
    }
    getFormattedTimeToLeave(){
        let ttl = this.getEstimatedTimeToLeave();
        let date = new Date(ttl);
        return date.toLocaleDateString("fr-FR", {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:"2-digit"});
    }
    static checkForUpdate(timeTracker) {
        let now = Date.now();
        let startPlusOneDay = timeTracker.startTime + 24 * 60 * 60 * 1000;
        let bool = now >= startPlusOneDay
        return bool;
    }
    
    updateDebt(){
        let workingTime = this.getWorkingTime();
        this.debt+= workingTime;
    }
    getWorkingTime() {
        let sum = 0;
        let length = this.phases.length;
        for(let i = 0; i< length - 1; i++){
            let elt = this.phases[i]
            if(elt.type == "Work"){
                sum += elt.duration;
            }
        }
        return sum;
    }
    buildPhasesTemplates(parentNode){
        parentNode.innerHTML = "";
        for(let phase of this.phases){
            let phaseDiv = document.createElement("div");
            phaseDiv.innerHTML = `<strong>${phase.type} phase : </strong> Duration : ${formatTime(phase.duration)}`;
            parentNode.appendChild(phaseDiv);
        }
    }

}

function formatTime(time){
    
    let seconds = Math.floor(time / 1000);
    let h = Math.floor(seconds / 60 /60 );
    seconds = seconds % (60*60);
    let m = Math.floor(seconds / 60);
    s = seconds % 60;
    h = (h < 10) ? '0'+h: h;
    m = (m < 10) ? '0'+m : m;
    s = (s < 10) ? '0'+s : s;
    return `${h}:${m}:${s}`
}


const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
let today = new Date()
let todayFormatted = today.toLocaleDateString("fr-FR", options);
let currentTimeTracker;


let working;

let button = document.getElementById("toggle");
let hour = document.getElementById("hour");
let ttl = document.getElementById("ttl");
let phases = document.getElementById("phases");

document.getElementById("today").innerText = todayFormatted;
hour.innerHTML = today.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });


button.addEventListener('click', () => {


    let lastPhase = currentTimeTracker.getLastPhase();
    if (lastPhase) {
        lastPhase.end = Date.now();
        lastPhase.duration = lastPhase.end - lastPhase.start;
        currentTimeTracker.addPhase(lastPhase);
    }

    let currentPhase = {
        type: (working) ? "Break" : "Work",
        start: Date.now(),
        end: undefined,
        duration: undefined
    }
    currentTimeTracker.addPhase(currentPhase);
    currentTimeTracker.updateDebt();
    currentTimeTracker.store();
    currentTimeTracker.buildPhasesTemplates(phases);
    working = !working;

    button.innerHTML = (working) ? "Pause" : "Work";
})

window.addEventListener('load', () => {

    let json = TimeTracker.get("timeTracker");
    if (!json) {
        currentTimeTracker = new TimeTracker("timeTracker", 30 * 60 * 1000);
    }
    else {
        let oldTT = TimeTracker.newFromJson(json);
        currentTimeTracker = oldTT;
        if (TimeTracker.checkForUpdate(oldTT)) {  
            currentTimeTracker.debt += currentTimeTracker.dayDuration;
        }
    }


    working = (currentTimeTracker.getLastPhaseType() == "Work");
    button.innerHTML = (working) ? "Pause" : "Work";
    ttl.innerHTML = `TTL : ${currentTimeTracker.getFormattedTimeToLeave()}`
    currentTimeTracker.store();
    currentTimeTracker.buildPhasesTemplates(phases);
    console.log(currentTimeTracker);
})


