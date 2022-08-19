class TimeTracker {

    constructor(storageKey, dayDuration) {

        this.debt = -dayDuration;
        this.storageKey = storageKey;
        this.dayDuration = dayDuration;
        this.startTime = null;
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
        if(!this.startTime){
            return Date.now()-this.debt;
        }
        return this.startTime + this.dayDuration+ this.getBreakTime();
    }
    getFormattedTimeToLeave(){
        let timeToLeave = this.getEstimatedTimeToLeave();
        let date = new Date(timeToLeave);
        return date.toLocaleDateString("en-EN", {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:"2-digit"});
    }
    static checkForUpdate(timeTracker) {
        if(!timeTracker.startTime) return false;
        let now = Date.now();
        let startPlusOneDay = timeTracker.startTime + 24 * 60 * 60 * 1000;
        return  (now >= startPlusOneDay)
    }
    
    updateDebt(){

        if(this.phases.length <= 1){
            return;
        }
        let lastPhase = this.phases[this.phases.length - 2]
        if(lastPhase.type == "Work" ){
            this.debt+= lastPhase.duration;
        }        
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
    getBreakTime() {
        let sum = 0;
        let length = this.phases.length;
        for(let i = 0; i< length - 1; i++){
            let elt = this.phases[i]
            if(elt.type == "Break"){
                sum += elt.duration;
            }
        }
        return sum;
    }
    getRemainigWorkingTime(){
        return this.dayDuration
    }
    buildPhasesTemplates(parentNode){
        parentNode.innerHTML = "";
        for(let i = 0; i < this.phases.length - 1; i++){
            let phase = this.phases[i];
            let phaseDiv = document.createElement("div");
            phaseDiv.innerHTML = `<strong>${phase.type} phase : </strong> Duration : ${formatTime(phase.duration)}`;
            parentNode.appendChild(phaseDiv);
        }
    }
    updateRemainingTimeTemplate(node){
        node.innerHTML = `Remaining work time: ${formatTime(-this.debt)}`
    }
    updateTimeToLeaveTemplate(node){
        node.innerHTML = `TTL : ${this.getFormattedTimeToLeave()}`
    }
    updateStartingTimeTemplate(node){
        if(!this.startTime){
            node.innerHTML = "Your work day hasn't started yet."
        }
        else{
            let start = new Date(this.startTime).toLocaleDateString("en-EN", {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:"2-digit"});
            node.innerHTML = `Work day started ${start}`
        }
    }
}

function formatTime(time){
    
    let seconds = Math.floor(time / 1000);
    let h = Math.floor(seconds / 60 /60 );
    seconds = seconds % (60*60);
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
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
let remaining = document.getElementById("remaining");

document.getElementById("today").innerText = todayFormatted;
hour.innerHTML = today.toLocaleTimeString("en-EN", { hour: '2-digit', minute: '2-digit' });


button.addEventListener('click', () => {


    let lastPhase = currentTimeTracker.getLastPhase();
    if (lastPhase) {
        lastPhase.end = Date.now();
        lastPhase.duration = lastPhase.end - lastPhase.start;
        currentTimeTracker.addPhase(lastPhase);
    }
    else{
        currentTimeTracker.startTime = Date.now();
    }
    let currentPhase = {
        type: (working) ? "Break" : "Work",
        start: Date.now(),
        end: undefined,
        duration: undefined
    }
    currentTimeTracker.addPhase(currentPhase);
    currentTimeTracker.updateDebt();
    currentTimeTracker.updateRemainingTimeTemplate(remaining);
    currentTimeTracker.updateTimeToLeaveTemplate(ttl);
    currentTimeTracker.store();
    currentTimeTracker.buildPhasesTemplates(phases);
    
        working = !working;
    button.innerHTML = (working) ? "Pause" : "Work";
})

window.addEventListener('load', () => {

    let json = TimeTracker.get("timeTracker");
    if (!json) {
        currentTimeTracker = new TimeTracker("timeTracker", 7*60 * 60 * 1000);
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
    currentTimeTracker.updateStartingTimeTemplate(hour)
    currentTimeTracker.updateTimeToLeaveTemplate(ttl);
    currentTimeTracker.updateRemainingTimeTemplate(remaining);
    currentTimeTracker.store();
    currentTimeTracker.buildPhasesTemplates(phases);
    console.log(currentTimeTracker);
})