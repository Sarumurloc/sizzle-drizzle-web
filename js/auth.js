// 嚴謹邏輯：偵測哈佛身分並計算折扣
export function checkHarvardDiscount(email) {
    // 邊界檢查：忽略大小寫並移除空格
    const cleanEmail = email.trim().toLowerCase();
    
    // 核心判斷：是否以 @harvard.edu 結尾
    if (cleanEmail.endsWith('@harvard.edu')) {
        console.log("Harvard Discount Applied: 10% OFF");
        return 0.9; // 返回折扣係數
    }
    return 1.0; // 無折扣
}
