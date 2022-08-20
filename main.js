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
        timeTrack.phases = [];
        for(let prop of json.phases){
            timeTrack.phases.push(Phase.newFromJson(prop));
        }


        timeTrack.debt = json.debt;
        return timeTrack;
    }

    addPhase(phase) {
        if(!(phase instanceof Phase)) throw new Error("The phase you give is not of type 'Phase'.");
        this.phases.push(phase);
    }

    static get(storageKey) {
        return JSON.parse(localStorage.getItem(storageKey));
    }
    getLastPhase() {
        if (this.phases.length == 0) return null;
        return this.phases[this.phases.length - 1]
    }
    store() {
        localStorage.setItem(this.storageKey, JSON.stringify(this));
    }
    getDebt() {
        return this.debt;
    }
    getEstimatedTimeToLeave() {
        if (!this.startTime) {
            return Date.now() + this.dayDuration;
        }
        return this.startTime + this.dayDuration + this.getCumulativeTime(PhaseType.Break);
    }
    static checkForUpdate(timeTracker) {
        if (!timeTracker.startTime) return false;
        let now = Date.now();
        let startPlusOneDay = timeTracker.startTime + 12 * 60 * 60 * 1000;
        return (now >= startPlusOneDay)
    }

    getCumulativeTime(phaseType){
        if(!(phaseType instanceof PhaseType)) throw new Error("The phase type is incorrect");
        return this.phases.slice(0, this.phases.length - 1)
                          .filter((elt) => elt.type === phaseType)
                          .reduce((prev, curr) => prev + curr.getDuration(), 0);
    }

    buildPhasesTemplates(parentNode) {
        parentNode.innerHTML = `<tr> <th>Type</th><th>Period</th><th>Duration</th></tr>`;
        for (let i = 0; i < this.phases.length - 1; i++) {
            let phase = this.phases[i];
            let phaseTr = document.createElement("tr");
            phaseTr = phase.getPhaseLineTemplate();
            parentNode.appendChild(phaseTr);
        }
    }
    updateRemainingTimeTemplate(node) {
        let time = this.dayDuration - this.getCumulativeTime(PhaseType.Work);
        node.innerHTML= `&#9203; Your remaining work time is ${formatTime(time)}`
    }
    updateTimeToLeaveTemplate(node) {
        node.innerHTML = `&#x1F3C1; Your time to leave is approximately ${timeStringHm(this.getEstimatedTimeToLeave())}`
    }
    updateStartingTimeTemplate(node) {
        if (!this.startTime) {
            node.innerHTML = `&#128681; Your work day hasn't started yet.`;
        }
        else {
            node.innerHTML= `&#128681; Your work day started at ${timeStringHm(this.startTime)}`
        }
    }
    updateCurrentPhaseTemplate(node) {
        let phase = this.getLastPhase();
        let phrase = `Your work day hasn't started.`;
        if (phase) {
         phrase = phase.getSummary();
        }
       
        node.innerText = phrase;
    }
}

class PhaseType{
    static Work = new PhaseType("Work");
    static Break = new PhaseType("Break");
    constructor(name){
        this.name = name;
    }
    equals(other){
        
        if(!(other instanceof PhaseType)) return false;
        return (other.name == this.name);
    }
}

class Phase {
    
    constructor(type, start){
        if(type && !(type instanceof PhaseType)) throw new Error("The type is not valid.");
        this.type = type;
        this.start = start;
        this.end = undefined;
        this.duration = undefined;
    }
    static newFromJson(json){

        let phase = new Phase();

        phase.type = new PhaseType(json.type.name);
        phase.start = json.start;
        phase.end = json.end;
        phase.duration = json.duration;

        return phase;

    }
    getDuration(){
        if(this.duration){
            return this.duration;
        }
        else{
            return Date.now() - this.start;
        }
    }
    getStart(){
        return this.start;
    }
    getType(){
        return this.type;
    }
    complete(end){
        this.end = end;
        this.duration = this.end - this.start;
    }
    getSummary(){
        return `You ${(this.type.equals(PhaseType.Work)) ? "are working " : "have break"} for ${formatTime(this.getDuration())}`;
    }
    chooseEmoji(){
        if (this.type.equals(PhaseType.Work)) {
            return '&#x1F4BB;';
        }
        else {
            if (this.duration < 2 * 60 * 1000) return "&#x1F4F1;"
            else if (this.duration >= 2 * 60 * 1000 && this.duration < 5 * 60 * 1000) return "&#x1F6BB;"
            else if (this.duration >= 5 * 60 * 1000 && this.duration < 30 * 60 * 1000) return "&#x2615;"
            else return "&#x1F35D;";
        }
    }
    getPhaseLineTemplate(){
        let phaseTr = document.createElement("tr");
        phaseTr.innerHTML = `<td><span>${this.chooseEmoji()}</span></td>
                             <td>${timeStringHm(this.start)} - ${timeStringHm(this.end)}</td>
                             <td>${formatTime(this.duration)}</td>`;
        return phaseTr;
    }


}

function timeStringHm(time){
    return new Date(time).toLocaleTimeString("en-EN", { hour: '2-digit', minute: "2-digit" })
}
function formatTime(time) {
    let seconds = Math.floor(time / 1000);  
    let h = Math.floor(seconds / 60 / 60);
    seconds = seconds % (60 * 60);
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    h = (h < 10) ? '0' + h : h;
    m = (m < 10) ? '0' + m : m;
    s = (s < 10) ? '0' + s : s;
    return `${h}:${m}:${s}`
}

const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
let today = new Date()
let todayFormatted = today.toLocaleDateString("en-EN", options);
let currentTimeTracker;


let working;

let button = document.getElementById("toggle");
let hour = document.getElementById("hour");
let ttl = document.getElementById("ttl");
let phases = document.getElementById("phases");
let remaining = document.getElementById("remaining");
let current = document.getElementById("current");

document.getElementById("today").innerText = todayFormatted;

setInterval(() => {
    currentTimeTracker.updateCurrentPhaseTemplate(current);
    currentTimeTracker.updateRemainingTimeTemplate(remaining);
    currentTimeTracker.updateTimeToLeaveTemplate(ttl);


}, 1000)

button.addEventListener('click', () => {


    let lastPhase = currentTimeTracker.getLastPhase();
    if (lastPhase) {
       lastPhase.complete(Date.now()); 
    }
    else {
        currentTimeTracker.startTime = Date.now();
    }
    let type = (working) ? PhaseType.Break : PhaseType.Work;
    let currentPhase = new Phase(type, Date.now());
    console.log(currentPhase);

    currentTimeTracker.addPhase(currentPhase);
    currentTimeTracker.updateRemainingTimeTemplate(remaining);
    currentTimeTracker.updateTimeToLeaveTemplate(ttl);
    currentTimeTracker.updateCurrentPhaseTemplate(current)
    currentTimeTracker.store();
    currentTimeTracker.buildPhasesTemplates(phases);
    working = !working;
    button.innerHTML = (working) ? "Take a Break" : "Go Work !";
})

window.addEventListener('load', () => {

    let json = TimeTracker.get("timeTracker");
    if (!json) {
        currentTimeTracker = new TimeTracker("timeTracker", 7 * 60 * 60 * 1000);
    }
    else {
        let oldTT = TimeTracker.newFromJson(json);
        currentTimeTracker = oldTT;
        if (TimeTracker.checkForUpdate(oldTT)) {
            currentTimeTracker = new TimeTracker("timeTracker", 7 * 60 * 60 * 1000);
        }
    }

    let lastPhase = currentTimeTracker.getLastPhase()
    if (lastPhase) {
        working = (lastPhase.type.equals(PhaseType.Work));
    }
    else {
        working = false;
    }

    button.innerHTML = (working) ? "Take a Break" : "Go Work !";
     currentTimeTracker.updateStartingTimeTemplate(hour)
    currentTimeTracker.updateTimeToLeaveTemplate(ttl);
    currentTimeTracker.updateRemainingTimeTemplate(remaining);
    currentTimeTracker.store();
    currentTimeTracker.buildPhasesTemplates(phases);
    console.log(currentTimeTracker);
})