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
        return this.startTime + this.dayDuration + this.getBreakTime();
    }
    getFormattedTimeToLeave() {
        let timeToLeave = this.getEstimatedTimeToLeave();
        return timeStringHm(timeToLeave)
    }
    static checkForUpdate(timeTracker) {
        if (!timeTracker.startTime) return false;
        let now = Date.now();
        let startPlusOneDay = timeTracker.startTime + 12 * 60 * 60 * 1000;
        return (now >= startPlusOneDay)
    }

    getBreakTime() {
        let breakTime = 0;
        let pastBreakTime = this.phases.slice(0, this.phases.length - 1)
                          .filter((elt) => elt.type == "Break")
                          .reduce((prev, curr) => prev + curr.duration, 0);
        breakTime+=pastBreakTime;
        let phase = this.getLastPhase();
        if(phase){
            if(phase.type == "Break"){
                let duration = Date.now() - phase.start;
                breakTime+=duration;
            }
        }
        return breakTime;
    }

    getWorkedTime(){
        let workedTime = 0;
        let pastWorkedTime = this.phases.slice(0, this.phases.length - 1)
                          .filter((elt) => elt.type == "Work")
                          .reduce((prev, curr) => prev + curr.duration, 0);
        workedTime+=pastWorkedTime;
        let phase = this.getLastPhase();
        if(phase){
            if(phase.type == "Work"){
                let duration = Date.now() - phase.start;
                workedTime+=duration;
            }
        }
        return workedTime;
    }

    choosePhaseEmoji(phase) {
        if (phase.type == "Work") {
            return '&#x1F4BB;';
        }
        else {
            if (phase.duration >= 5 * 60 * 1000 && phase.duration < 30 * 60 * 1000) return "&#x2615;"
            else if (phase.duration < 2 * 60 * 1000) return "&#x1F4F1;"
            else if (phase.duration >= 2 * 60 * 1000 && phase.duration < 5 * 60 * 1000) return "&#x1F6BB;"
            else if (phase.duration >= 30 * 60 * 1000) return "&#x1F35D;";
        }
    }
    buildPhasesTemplates(parentNode) {
        parentNode.innerHTML = `<tr> <th>Type</th><th>Period</th><th>Duration</th></tr>`;
        for (let i = 0; i < this.phases.length - 1; i++) {
            let phase = this.phases[i];
            let phaseTr = document.createElement("tr");
            phaseTr.innerHTML = `<td><span>${this.choosePhaseEmoji(phase)}</span></td>
                                 <td>${timeStringHm(phase.start)} - ${timeStringHm(phase.end)}</td>
                                 <td>${formatTime(phase.duration)}</td>`;
            parentNode.appendChild(phaseTr);
        }
    }
    updateRemainingTimeTemplate(node) {
        let time = this.dayDuration - this.getWorkedTime();
        node.innerHTML= `&#9203; Your remaining work time is ${formatTime(time)}`
    }
    updateTimeToLeaveTemplate(node) {
        node.innerHTML = `&#x1F3C1; Your time to leave is approximately ${timeStringHm(this.getEstimatedTimeToLeave())}`
    }
    updateStartingTimeTemplate(node) {
        if (!this.startTime) {
            node.innerHTML = "&#128681; Your work day hasn't started yet."
        }
        else {
            node.innerHTML= `&#128681; Your work day started at ${timeStringHm(this.startTime)}`
        }
    }
    updateCurrentPhaseTemplate(node) {
        let phase = this.getLastPhase();
        let phrase;
        if (phase) {
            let duration = Date.now() - phase.start;
            phrase = `You ${(phase.type == "Work") ? "are working " : "have break"} for ${formatTime(duration)}`
        }
        else {
            phrase = `Your work day hasn't started.`
        }
        node.innerText = phrase;
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
        lastPhase.end = Date.now();
        lastPhase.duration = lastPhase.end - lastPhase.start;
    }
    else {
        currentTimeTracker.startTime = Date.now();
    }
    let currentPhase = {
        type: (working) ? "Break" : "Work",
        start: Date.now(),
        end: undefined,
        duration: undefined
    }
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
            //currentTimeTracker.debt += currentTimeTracker.dayDuration;
        }
    }

    let lastPhase = currentTimeTracker.getLastPhase()
    if (lastPhase) {
        working = (lastPhase.type == "Work");
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