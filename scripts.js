let segundos = 0;
let intervalo = null;
let modo = localStorage.getItem("modoAtual") || "cronometro";
let timerInicial = Number(localStorage.getItem("tempoTimer")) || 5 * 60;

const LIMITE_HORAS = 99;
const LIMITE_MINUTOS_SEGUNDOS = 59;
const LIMITE_SEGUNDOS = LIMITE_HORAS * 3600 + 59 * 60 + 59;

const hoursEl = document.querySelector("#hours");
const minutesEl = document.querySelector("#minutes");
const secondsEl = document.querySelector("#seconds");

const playBtn = document.querySelector(".play");
const pauseBtn = document.querySelector(".pause");
const stopBtn = document.querySelector(".stop");

const modoCronometro = document.querySelector("#modo-cronometro");
const modoTimer = document.querySelector("#modo-timer");

const increaseBtn = document.querySelector("#increase-time");
const decreaseBtn = document.querySelector("#decrease-time");

const timerEl = document.querySelector("#timer");

timerInicial = Math.min(timerInicial, LIMITE_SEGUNDOS);

function salvarTempoTimer() {
    localStorage.setItem("tempoTimer", timerInicial);
}

function salvarModo() {
    localStorage.setItem("modoAtual", modo);
}

function salvarTimerRodando() {
    if (modo === "timer" && segundos > 0) {
        localStorage.setItem("timerRodando", "true");
        localStorage.setItem("timerFim", Date.now() + segundos * 1000);
    }
}

function limparTimerRodando() {
    localStorage.removeItem("timerRodando");
    localStorage.removeItem("timerFim");
}

function atualizarDisplay() {
    segundos = Math.min(segundos, LIMITE_SEGUNDOS);

    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const restoSegundos = segundos % 60;

    hoursEl.textContent = String(horas).padStart(2, "0");
    minutesEl.textContent = String(minutos).padStart(2, "0");
    secondsEl.textContent = String(restoSegundos).padStart(2, "0");
}

function tocarAlarme() {
    timerEl.classList.add("alarmando");

    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.play();

    if ("vibrate" in navigator) {
        navigator.vibrate([300, 150, 300, 150, 500]);
    }

    setTimeout(() => {
        timerEl.classList.remove("alarmando");
    }, 2000);
}

function atualizarBotoes() {
    playBtn.style.display = intervalo === null ? "inline-block" : "none";
    pauseBtn.style.display = intervalo === null ? "none" : "inline-block";
}

function atualizarControlesTimer() {
    const display = modo === "timer" ? "inline-flex" : "none";

    increaseBtn.style.display = display;
    decreaseBtn.style.display = display;
}

function pararIntervalo() {
    clearInterval(intervalo);
    intervalo = null;
    atualizarBotoes();
}

function definirTimer(horas, minutos, segs) {
    horas = Math.min(Math.max(horas, 0), LIMITE_HORAS);
    minutos = Math.min(Math.max(minutos, 0), LIMITE_MINUTOS_SEGUNDOS);
    segs = Math.min(Math.max(segs, 0), LIMITE_MINUTOS_SEGUNDOS);

    const total = horas * 3600 + minutos * 60 + segs;

    segundos = Math.min(Math.max(0, total), LIMITE_SEGUNDOS);
    timerInicial = segundos;

    limparTimerRodando();
    salvarTempoTimer();
    atualizarDisplay();
}

function moverCursorParaFim(elemento) {
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(elemento);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
}

function permitirEdicaoTempo(elemento, tipo) {
    elemento.setAttribute("contenteditable", "true");

    elemento.addEventListener("focus", () => {
        if (modo !== "timer") {
            elemento.blur();
            return;
        }

        pararIntervalo();
        limparTimerRodando();

        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(elemento);
        selection.removeAllRanges();
        selection.addRange(range);
    });

    elemento.addEventListener("keydown", (event) => {
        const teclasPermitidas = [
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Tab"
        ];

        if (event.key === "Enter") {
            event.preventDefault();
            elemento.blur();
            return;
        }

        if (!/^\d$/.test(event.key) && !teclasPermitidas.includes(event.key)) {
            event.preventDefault();
        }
    });

    elemento.addEventListener("input", () => {
        let valorDigitado = elemento.textContent.replace(/\D/g, "");

        valorDigitado = valorDigitado.slice(0, 2);

        let numero = Number(valorDigitado);

        if (tipo === "horas" && numero > LIMITE_HORAS) {
            numero = LIMITE_HORAS;
        }

        if ((tipo === "minutos" || tipo === "segundos") && numero > LIMITE_MINUTOS_SEGUNDOS) {
            numero = LIMITE_MINUTOS_SEGUNDOS;
        }

        elemento.textContent = valorDigitado === "" ? "" : String(numero);
        moverCursorParaFim(elemento);
    });

    elemento.addEventListener("blur", () => {
        const horasAtuais = Math.floor(segundos / 3600);
        const minutosAtuais = Math.floor((segundos % 3600) / 60);
        const segundosAtuais = segundos % 60;

        let valor = Number(elemento.textContent);

        if (isNaN(valor)) valor = 0;

        if (tipo === "horas") {
            valor = Math.min(valor, LIMITE_HORAS);
            definirTimer(valor, minutosAtuais, segundosAtuais);
        }

        if (tipo === "minutos") {
            valor = Math.min(valor, LIMITE_MINUTOS_SEGUNDOS);
            definirTimer(horasAtuais, valor, segundosAtuais);
        }

        if (tipo === "segundos") {
            valor = Math.min(valor, LIMITE_MINUTOS_SEGUNDOS);
            definirTimer(horasAtuais, minutosAtuais, valor);
        }
    });
}

function iniciarIntervalo() {
    intervalo = setInterval(() => {
        if (modo === "cronometro") {
            segundos++;

            if (segundos > LIMITE_SEGUNDOS) {
                segundos = LIMITE_SEGUNDOS;
                pararIntervalo();
            }
        } else {
            if (segundos > 0) {
                segundos--;
                salvarTimerRodando();
            }

            if (segundos === 0) {
                pararIntervalo();
                limparTimerRodando();
                tocarAlarme();
            }
        }

        atualizarDisplay();
    }, 1000);

    atualizarBotoes();
}

function play() {
    if (intervalo !== null) return;

    document.activeElement.blur();

    if (modo === "timer" && segundos <= 0) {
        segundos = timerInicial;
    }

    if (modo === "timer" && segundos <= 0) return;

    salvarTimerRodando();
    iniciarIntervalo();
}

function pause() {
    pararIntervalo();
    limparTimerRodando();
}

function stop() {
    pararIntervalo();
    limparTimerRodando();

    segundos = 0;

    if (modo === "timer") {
        timerInicial = 0;
        salvarTempoTimer();
    }

    timerEl.classList.remove("alarmando");
    atualizarDisplay();
}

modoCronometro.addEventListener("click", () => {
    pararIntervalo();
    limparTimerRodando();

    modo = "cronometro";
    segundos = 0;

    salvarModo();

    modoCronometro.classList.add("active");
    modoTimer.classList.remove("active");

    timerEl.classList.remove("alarmando");
    atualizarControlesTimer();
    atualizarDisplay();
});

modoTimer.addEventListener("click", () => {
    pararIntervalo();
    limparTimerRodando();

    modo = "timer";
    segundos = timerInicial;

    salvarModo();

    modoTimer.classList.add("active");
    modoCronometro.classList.remove("active");

    timerEl.classList.remove("alarmando");
    atualizarControlesTimer();
    atualizarDisplay();
});

increaseBtn.addEventListener("click", () => {
    if (modo !== "timer") return;

    limparTimerRodando();

    segundos = Math.min(segundos + 60, LIMITE_SEGUNDOS);
    timerInicial = segundos;

    salvarTempoTimer();
    atualizarDisplay();
});

decreaseBtn.addEventListener("click", () => {
    if (modo !== "timer") return;

    limparTimerRodando();

    segundos = Math.max(0, segundos - 60);
    timerInicial = segundos;

    salvarTempoTimer();
    atualizarDisplay();
});

permitirEdicaoTempo(hoursEl, "horas");
permitirEdicaoTempo(minutesEl, "minutos");
permitirEdicaoTempo(secondsEl, "segundos");

playBtn.addEventListener("click", play);
pauseBtn.addEventListener("click", pause);
stopBtn.addEventListener("click", stop);

pauseBtn.style.display = "none";

if (modo === "timer") {
    const timerRodando = localStorage.getItem("timerRodando") === "true";
    const timerFim = Number(localStorage.getItem("timerFim"));

    modoTimer.classList.add("active");
    modoCronometro.classList.remove("active");

    if (timerRodando && timerFim) {
        const restante = Math.ceil((timerFim - Date.now()) / 1000);

        if (restante > 0) {
            segundos = Math.min(restante, LIMITE_SEGUNDOS);
            iniciarIntervalo();
        } else {
            segundos = 0;
            limparTimerRodando();
            tocarAlarme();
        }
    } else {
        segundos = timerInicial;
    }
} else {
    segundos = 0;
    modoCronometro.classList.add("active");
    modoTimer.classList.remove("active");
}

atualizarControlesTimer();
atualizarDisplay();

window.addEventListener("load", () => {
    document.body.style.opacity = "1";
});