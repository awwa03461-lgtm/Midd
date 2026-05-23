// ============================================================
// FLAPPY MIDEN — Miden Wallet Integration
// ============================================================
//
// این فایل ارتباط بازی با Miden Wallet Extension رو مدیریت می‌کنه.
// 
// روش کار:
// ۱. تشخیص اینکه Miden Wallet نصب شده یا نه
// ۲. درخواست اتصال (پاپ‌آپ extension باز می‌شه)
// ۳. ارسال تراکنش Note با امتیاز کاربر
// 
// نکته: API دقیق Miden Wallet هنوز در حال تکامله.
// این کد بر اساس استاندارد wallet adapter ها نوشته شده.

const MIDEN_CONFIG = {
    rpcEndpoint: 'https://rpc.testnet.miden.io:443',
    explorerUrl: 'https://testnet.midenscan.com',
    // آدرس receiver Note های امتیاز (همون wallet که قبلاً ساختی)
    gameReceiver: '0xade4a7d35f1fcb8037f1b6ab907cf5'
};

class MidenWallet {
    constructor() {
        this.address = null;
        this.connected = false;
        this.useMockMode = false; // اگه true، بدون wallet کار می‌کنه (برای تست)
    }
    
    /**
     * بررسی اینکه Miden Wallet نصب هست یا نه
     */
    isInstalled() {
        return typeof window.miden !== 'undefined' || 
               typeof window.midenWallet !== 'undefined';
    }
    
    /**
     * گرفتن provider Wallet
     */
    getProvider() {
        return window.miden || window.midenWallet || null;
    }
    
    /**
     * اتصال به wallet (پاپ‌آپ extension باز می‌شه)
     */
    async connect() {
        // اگه Mock mode فعاله، بدون wallet کار کن
        if (this.useMockMode) {
            await this.delay(800);
            this.address = 'mtst1q' + this.randomHex(38);
            this.connected = true;
            localStorage.setItem('mock_address', this.address);
            return this.address;
        }
        
        // بررسی نصب بودن
        if (!this.isInstalled()) {
            throw new Error('NOT_INSTALLED');
        }
        
        try {
            const provider = this.getProvider();
            
            // درخواست اتصال — extension پاپ‌آپ نشون می‌ده
            const accounts = await provider.request({
                method: 'miden_requestAccounts'
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned');
            }
            
            this.address = accounts[0];
            this.connected = true;
            
            return this.address;
            
        } catch (err) {
            console.error('Wallet connection error:', err);
            if (err.code === 4001 || err.message?.includes('reject')) {
                throw new Error('کاربر اتصال رو رد کرد');
            }
            throw new Error('اتصال به wallet ناموفق: ' + (err.message || 'خطای نامشخص'));
        }
    }
    
    /**
     * قطع اتصال
     */
    disconnect() {
        this.address = null;
        this.connected = false;
        localStorage.removeItem('mock_address');
    }
    
    /**
     * ارسال تراکنش Note با امتیاز
     * @param {number} score - امتیاز کاربر
     * @param {string} signature - signature از سرور (برای anti-cheat)
     * @returns {Promise<{txHash: string}>}
     */
    async submitScore(score, signature = null) {
        if (!this.connected) {
            throw new Error('اول wallet رو وصل کن');
        }
        
        // Mock mode
        if (this.useMockMode) {
            await this.delay(1500);
            return { txHash: '0x' + this.randomHex(64) };
        }
        
        try {
            const provider = this.getProvider();
            
            // ساخت metadata Note
            const noteMetadata = {
                type: 'flappy-miden-score',
                score: score,
                player: this.address,
                timestamp: Date.now(),
                signature: signature
            };
            
            // ارسال تراکنش
            // ⚠️ syntax دقیق ممکنه بسته به نسخه wallet فرق کنه
            const result = await provider.request({
                method: 'miden_sendTransaction',
                params: [{
                    from: this.address,
                    to: MIDEN_CONFIG.gameReceiver,
                    noteType: 'public',
                    noteData: JSON.stringify(noteMetadata),
                    // مقدار توکن (می‌تونه صفر باشه چون فقط می‌خواییم Note بفرستیم)
                    amount: '0'
                }]
            });
            
            return {
                txHash: result.transactionHash || result.txHash || result,
                blockNumber: result.blockNumber
            };
            
        } catch (err) {
            console.error('Transaction error:', err);
            if (err.code === 4001) {
                throw new Error('کاربر تراکنش رو رد کرد');
            }
            throw new Error('ارسال تراکنش ناموفق: ' + (err.message || 'خطای نامشخص'));
        }
    }
    
    /**
     * URL تراکنش روی explorer
     */
    getExplorerUrl(txHash) {
        return `${MIDEN_CONFIG.explorerUrl}/tx/${txHash}`;
    }
    
    /**
     * مخفف کردن آدرس برای نمایش
     */
    shortAddress(addr) {
        if (!addr) return '0x000...000';
        if (addr.length <= 14) return addr;
        return addr.slice(0, 8) + '...' + addr.slice(-6);
    }
    
    // ============ Helpers ============
    delay(ms) { return new Promise(r => setTimeout(r, ms)); }
    randomHex(length) {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * 16)];
        return result;
    }
}

window.MidenWallet = MidenWallet;
window.MIDEN_CONFIG = MIDEN_CONFIG;
