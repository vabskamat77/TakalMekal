
import { quiz } from './config.js';
import { load, channel, seconds } from './store.js';

const $ = id => document.getElementById(id),
    menu = $('menu'),
    view = $('view'),
    home = $('home');

let s, local = null, revision = 0;

const projector = new URLSearchParams(location.search)
    .has('projector');

function el(tag, text, cls) {
    const e = document.createElement(tag);
    e.textContent = text;
    if (cls) e.className = cls;
    return e;
}

// Home page team score cards
function renderHomeScores() {
    const cards = $('live-scores');
    cards.replaceChildren();

    s.teams.forEach((name, i) => {
        const card = el('article', '', 'score-card');

        card.append(
            el('h3', name),
            el(
                'strong',
                s.scores[i].reduce((a, b) => a + b, 0),
                'score-total'
            ),
            el('span', 'POINTS')
        );

        cards.append(card);
    });
}

// Render projector display
function render() {
    if (!s) return;

    const screen = local?.screen ?? s.screen,
        r = local?.round ?? s.round;

    menu.hidden = screen !== 'home';
    view.hidden = screen === 'home';
    home.hidden = projector || screen === 'home';

    view.replaceChildren();

    // Home page
    if (screen === 'home') {
        renderHomeScores();
        return;
    }

    // Scoreboard page
    if (screen === 'scores') {
        view.append(el('h2', 'Scoreboard'));

        const t = document.createElement('table');

        const row = (vals, tag) => {
            const tr = document.createElement('tr');

            vals.forEach(v => {
                tr.append(el(tag, v));
            });

            t.append(tr);
        };

        row(
            ['Team', 'R1', 'R2', 'R3', 'R4', 'Total'],
            'th'
        );

        s.teams.forEach((n, i) => {
            row(
                [
                    n,
                    ...s.scores[i],
                    s.scores[i].reduce((a, b) => a + b, 0)
                ],
                'td'
            );
        });

        view.append(t);
        return;
    }

    // Round display
    view.append(
        el('h2', `Round ${r} — ${quiz.rounds[r - 1].name}`)
    );

    // Round 3 placeholder
    if (r === 3) {
        view.append(
            el('p', 'Round format to be decided.')
        );
        return;
    }

    // Active team and question mode
    view.append(
        el('h3', s.teams[s.team]),
        el(
            'p',
            local
                ? 'Waiting for quiz master'
                : s.mode === 'passed'
                    ? 'Passed question'
                    : r === 4
                        ? 'Rapid fire'
                        : 'Direct question'
        )
    );

    // Countdown timer
    const clock = el('div', '', 'timer');
    clock.id = 'clock';

    view.append(
        clock,
        el('p', 'Waiting for question bank · Step 2')
    );

    tick();
}

// Update countdown timer
function tick() {
    const c = $('clock');

    if (!c || !s) return;

    const n = local
        ? (local.round === 4 ? 60 : 10)
        : seconds(s.timer);

    c.textContent =
        `${String(Math.floor(n / 60)).padStart(2, '0')}:` +
        `${String(n % 60).padStart(2, '0')}`;
}

// Refresh data from local database
async function refresh() {
    const id = ++revision;

    try {
        const next = await load();

        if (id !== revision) return;

        s = next;
        local = null;

        render();

    } catch (e) {
        view.hidden = false;
        view.textContent =
            'Local database unavailable: ' + e.message;
    }
}

// Synchronize with admin console
channel.onmessage = refresh;

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
});

// Timer refresh
setInterval(tick, 100);

// Projector synchronization fallback
setInterval(() => {
    if (projector) refresh();
}, 3000);

// Navigation controls
if (projector) {

    menu.querySelectorAll('button').forEach(b => {
        b.disabled = true;
    });

} else {

    document.querySelectorAll('[data-round]').forEach(b => {
        b.onclick = () => {
            local = {
                screen: 'round',
                round: Number(b.dataset.round)
            };

            render();
        };
    });

    home.onclick = () => {
        local = { screen: 'home' };
        render();
    };
}

// Fullscreen control
$('full').onclick = async () => {
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await document.documentElement.requestFullscreen();
        }
    } catch {
        alert('Fullscreen unavailable.');
    }
};

// Update fullscreen button label
document.addEventListener('fullscreenchange', () => {
    $('full').textContent = document.fullscreenElement
        ? 'Exit Fullscreen'
        : 'Fullscreen';
});

// Initialize application
refresh();
