#!/bin/bash

# --- ១. ការកំណត់ (Configurations) ---
# ត្រូវប្រាកដថា Path នេះត្រូវនឹង Folder ជាក់ស្តែងរបស់អ្នក
PROJECT_PATH="/www/wwwroot/id.efimef.org/Digital-ID"
BACKUP_PATH="/www/backup/webhooks/id.efimef.org"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_NAME="digital-id-admin" # ឈ្មោះនៅក្នុង pm2 (មើលតាម pm2 list)

# ព័ត៌មាន Telegram
TG_TOKEN="YOUR_BOT_TOKEN_HERE"
TG_CHAT_ID="YOUR_CHAT_ID_HERE"

mkdir -p $BACKUP_PATH

# --- មុខងារផ្ញើសារទៅ Telegram ---
send_tg() {
    local msg="$1"
    curl -s -X POST "https://api.telegram.org/bot$TG_TOKEN/sendMessage" \
        -d "chat_id=$TG_CHAT_ID" \
        -d "text=🔔 [Digital-ID System]: $msg" > /dev/null
}

# --- មុខងារទី ១៖ Deploy (GitHub -> aaPanel) ---
do_deploy() {
    echo "--- ⏳ កំពុងចាប់ផ្តើម Deploy... ---"
    send_tg "⏳ កំពុងចាប់ផ្តើម Deploy កូដថ្មី..."

    # 1. Backup កូដចាស់សិន
    tar -czf $BACKUP_PATH/backup_$TIMESTAMP.tar.gz -C $PROJECT_PATH .
    
    cd $PROJECT_PATH || exit

    # 2. ទាញកូដពី GitHub
    git fetch --all
    git reset --hard origin/main
    git pull origin main
    
    # 3. ដំឡើង Library និង Build (ប្រើ PNPM)
    echo "📦 កំពុង Install dependencies..."
    pnpm install
    
    echo "🏗️ កំពុង Build Frontend & Backend..."
    pnpm build
    
    # 4. Restart Server
    pm2 restart $APP_NAME || pm2 start dist/index.js --name $APP_NAME
    
    echo "✅ Deploy ជោគជ័យ!"
    send_tg "🚀 Deploy ជោគជ័យ! កូដថ្មីដំណើរការហើយ ($TIMESTAMP)"
}

# --- មុខងារទី ២៖ Push (aaPanel -> GitHub) ---
do_push() {
    echo "--- 📤 កំពុងរុញកូដពី Server ទៅ GitHub... ---"
    cd $PROJECT_PATH || exit
    
    # បង្កើត .gitignore បើមិនទាន់មាន
    if [ ! -f ".gitignore" ]; then
        echo "node_modules/\ndist/\n.env\n.DS_Store" > .gitignore
    fi
    
    git add .
    read -p "បញ្ចូលសារ Commit: " commit_msg
    git commit -m "Server Update ($TIMESTAMP): $commit_msg"
    
    if git push origin main; then
        send_tg "📤 Sync ពី Server ទៅ GitHub ជោគជ័យ!"
    else
        echo "❌ Push បរាជ័យ! សូមពិនិត្យមើល git status"
    fi
}

# --- មុខងារទី ៣៖ Rollback ---
do_rollback() {
    LATEST=$(ls -t $BACKUP_PATH/*.tar.gz | head -1)
    if [ -n "$LATEST" ]; then
        echo "🔙 កំពុងត្រឡប់ទៅ Backup: $LATEST"
        tar -xzf "$LATEST" -C $PROJECT_PATH
        
        cd $PROJECT_PATH || exit
        pnpm install
        pm2 restart $APP_NAME
        
        send_tg "⚠️ បានធ្វើ Rollback ទៅកាន់ Backup ចាស់វិញហើយ!"
    else
        echo "❌ រកមិនឃើញ Backup ទេ!"
    fi
}

# --- ម៉ឺនុយបញ្ជា (Interactive Menu) ---
if [ -t 0 ]; then
    clear
    echo "=========================================="
    echo "   🤖 DIGITAL ID - DEPLOYMENT MANAGER"
    echo "=========================================="
    echo "1. 🚀 Deploy   (Pull from GitHub & Build)"
    echo "2. 📤 Push     (Commit & Push to GitHub)"
    echo "3. 🔙 Rollback (Restore previous version)"
    echo "4. 📊 Check Logs (PM2)"
    echo "5. ❌ Exit"
    echo "=========================================="
    read -p "សូមជ្រើសរើសលេខ (1-5): " choice

    case $choice in
        1) do_deploy ;;
        2) do_push ;;
        3) do_rollback ;;
        4) pm2 logs $APP_NAME ;;
        5) exit 0 ;;
        *) echo "ជម្រើសមិនត្រឹមត្រូវ!" ;;
    esac
else
    # សម្រាប់ Webhook Trigger
    do_deploy
fi
