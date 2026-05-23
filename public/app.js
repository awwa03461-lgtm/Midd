// ============================================================
// FLAPPY MIDEN — App Controller
// ============================================================

const $ = (id) => document.getElementById(id);

class App {
    constructor() {
        this.canvas = $('gameCanvas');
        this.game = new FlappyGame(this.canvas);
        this.wallet = new MidenWallet();
        
        // اگه Miden Wallet نصب نیست، Mock mode فعال کن (برای دموی محلی)
        // در production این رو false کن
        this.wallet.useMockMode = !this.wallet.isInstalled();
        
        this.currentScore = 0;
        this.highScore = 0;
        this.gameStartTime = 0;
        this.gameEndTime = 0;
        
        this.bindEvents();
        this.bindGameCallbacks();
        this.game.drawIdle();
        this.refreshLeaderboard();
        
        // اگه Mock mode فعاله، توی footer نشون بده
        if (this.wallet.useMockMode) {
            const modeEl = document.querySelector('.footer-val:nth-of-type(2)');
            if (modeEl) modeEl.textContent = 'demo (no wallet)';
        }
    }
    
    bindEvents() {
        $('connectBtn').addEventListener('click', () => this.connectWallet());
        $('startBtn').addEventListener('click', () => this.startGame());
        $('restartBtn').addEventListener('click', () => this.startGame());
        $('submitBtn').addEventListener('click', () => this.submitScore());
        $('successCloseBtn').addEventListener('click', () => {
            this.hideAllOverlays();
            $('startScreen').classList.remove('overlay-hidden');
            this.game.drawIdle();
        });
        $('closeModalBtn').addEventListener('click', () => {
            $('installModal').classList.add('modal-hidden');
        });
    }
    
    bindGameCallbacks() {
        this.game.onScore = (score) => {
            this.currentScore = score;
            $('ingameScore').textContent = score;
        };
        this.game.onGameOver = (finalScore, startTime, endTime) => {
            this.gameStartTime = startTime;
            this.gameEndTime = endTime;
            this.showGameOver(finalScore);
        };
    }
    
    async connectWallet() {
        const btn = $('connectBtn');
        btn.disabled = true;
        btn.textContent = 'CONNECTING...';
        
        try {
            const address = await this.wallet.connect();
            
            $('walletStatus').classList.add('connected');
            $('walletText').textContent = 'CONNECTED';
            btn.textContent = this.wallet.shortAddress(address);
            btn.disabled = false;
            $('statAddress').textContent = this.wallet.shortAddress(address);
            
            await this.refreshStats();
            await this.refreshLeaderboard();
            
        } catch (err) {
            btn.disabled = false;
            btn.textContent = 'CONNECT WALLET';
            
            if (err.message === 'NOT_INSTALLED') {
                $('installModal').classList.remove('modal-hidden');
            } else {
                alert(err.message);
            }
        }
    }
    
    startGame() {
        if (!this.wallet.connected) {
            alert('First connect your wallet!');
            return;
        }
        this.hideAllOverlays();
        $('ingameScore').classList.add('show');
        $('ingameScore').textContent = '0';
        this.currentScore = 0;
        this.game.start();
    }
    
    showGameOver(finalScore) {
        $('ingameScore').classList.remove('show');
        $('finalScore').textContent = finalScore;
        const isNewRecord = finalScore > this.highScore && finalScore > 0;
        $('newRecordBanner').style.display = isNewRecord ? 'block' : 'none';
        $('submitBtn').disabled = (finalScore === 0);
        $('gameOverScreen').classList.remove('overlay-hidden');
    }
    
    async submitScore() {
        if (this.currentScore === 0) return;
        
        $('gameOverScreen').classList.add('overlay-hidden');
        $('txScreen').classList.remove('overlay-hidden');
        const statusEl = $('txStatus');
        
        try {
            // مرحله ۱: validate سمت سرور
            statusEl.textContent = 'Validating score...';
            const validateRes = await fetch('/api/validate-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: this.currentScore,
                    address: this.wallet.address,
                    gameStartTime: this.gameStartTime,
                    gameEndTime: this.gameEndTime
                })
            });
            
            if (!validateRes.ok) {
                const err = await validateRes.json();
                throw new Error(err.reason || 'Score validation failed');
            }
            const { signature } = await validateRes.json();
            
            // مرحله ۲: ارسال تراکنش روی Miden
            statusEl.textContent = 'Please approve in your wallet...';
            const result = await this.wallet.submitScore(this.currentScore, signature);
            
            // مرحله ۳: ذخیره در DB سرور
            statusEl.textContent = 'Recording on server...';
            await fetch('/api/record-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: this.wallet.address,
                    score: this.currentScore,
                    txHash: result.txHash
                })
            });
            
            // نمایش موفقیت
            $('txScreen').classList.add('overlay-hidden');
            $('txHashDisplay').textContent = result.txHash;
            $('explorerLink').href = this.wallet.getExplorerUrl(result.txHash);
            $('successScreen').classList.remove('overlay-hidden');
            
            await this.refreshStats();
            await this.refreshLeaderboard();
            
        } catch (err) {
            $('txScreen').classList.add('overlay-hidden');
            $('gameOverScreen').classList.remove('overlay-hidden');
            alert('خطا: ' + err.message);
        }
    }
    
    async refreshStats() {
        if (!this.wallet.connected) return;
        
        try {
            const res = await fetch(`/api/stats/${this.wallet.address}`);
            const data = await res.json();
            
            this.highScore = data.highScore;
            $('statHighScore').textContent = data.highScore;
            $('statGames').textContent = data.gamesPlayed;
            
            // global record از leaderboard
            const lbRes = await fetch('/api/leaderboard');
            const lbData = await lbRes.json();
            const global = lbData.scores.length ? lbData.scores[0].score : 0;
            $('statGlobal').textContent = global || '—';
            
        } catch (err) {
            console.error('Stats error:', err);
        }
    }
    
    async refreshLeaderboard() {
        const list = $('leaderboardList');
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            const scores = data.scores || [];
            
            if (!scores.length) {
                list.innerHTML = '<div class="lb-item lb-empty"><span>No scores yet.</span></div>';
                return;
            }
            
            list.innerHTML = scores.map((s, i) => {
                const rank = i + 1;
                const rankClass = rank === 1 ? 'lb-top1' : rank === 2 ? 'lb-top2' : rank === 3 ? 'lb-top3' : '';
                const medal = rank === 1 ? '★' : rank === 2 ? '☆' : rank === 3 ? '◇' : `#${rank}`;
                return `<div class="lb-item ${rankClass}">
                    <span class="lb-rank">${medal}</span>
                    <span class="lb-addr">${this.wallet.shortAddress(s.address)}</span>
                    <span class="lb-score">${s.score}</span>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('Leaderboard error:', err);
        }
    }
    
    hideAllOverlays() {
        ['startScreen', 'gameOverScreen', 'txScreen', 'successScreen'].forEach(id => {
            $(id).classList.add('overlay-hidden');
        });
    }
}

window.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
