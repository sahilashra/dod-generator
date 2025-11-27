# 🔑 SSH Key Setup for GitLab

## ✅ SSH Key Generated!

Your SSH key has been successfully generated at:
- **Private Key:** `C:\Users\Muhammed Sahil\.ssh\id_ed25519`
- **Public Key:** `C:\Users\Muhammed Sahil\.ssh\id_ed25519.pub`

## 📋 Your Public Key

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBe/QYCQqG/ZeORmplBvUXWF8IdVzp6uj35YFljmTqD/ your_email@example.com
```

## 🚀 Add SSH Key to GitLab

### Step 1: Copy Your Public Key

**PowerShell:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
```

Or manually copy the key above.

### Step 2: Add to GitLab

1. **Go to GitLab SSH Keys page:**
   - Visit: https://gitlab.com/-/profile/keys
   - Or: GitLab → Settings → SSH Keys

2. **Paste your public key:**
   - Paste the key in the "Key" field
   - Give it a title (e.g., "Windows Laptop")
   - Set expiration date (optional but recommended)
   - Click "Add key"

### Step 3: Test Your SSH Connection

```powershell
ssh -T git@gitlab.com
```

You should see:
```
Welcome to GitLab, @yourusername!
```

## 🔧 Configure Git to Use SSH

### Update Your Remote URL

If your repository is using HTTPS, switch to SSH:

```powershell
# Check current remote
git remote -v

# Change to SSH (replace with your repo)
git remote set-url origin git@gitlab.com:sahilashraf/DOD-Gen.git
```

### Clone New Repositories with SSH

```bash
# Instead of HTTPS:
# git clone https://gitlab.com/sahilashraf/DOD-Gen.git

# Use SSH:
git clone git@gitlab.com:sahilashraf/DOD-Gen.git
```

## 🔐 SSH Agent Setup (Optional but Recommended)

To avoid entering your passphrase every time:

### Start SSH Agent

```powershell
# Start the ssh-agent
Start-Service ssh-agent

# Add your key
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
```

### Make SSH Agent Start Automatically

```powershell
# Set ssh-agent to start automatically
Set-Service -Name ssh-agent -StartupType Automatic
```

## 📝 Quick Reference

### View Your Public Key
```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

### Copy Public Key to Clipboard
```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
```

### Test GitLab Connection
```powershell
ssh -T git@gitlab.com
```

### Check SSH Agent Status
```powershell
Get-Service ssh-agent
```

### Add Key to SSH Agent
```powershell
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
```

## 🔒 Security Best Practices

✅ **DO:**
- Keep your private key (`id_ed25519`) secure and never share it
- Use SSH keys instead of passwords for Git operations
- Set expiration dates on your SSH keys
- Use different SSH keys for different machines
- Add your key to ssh-agent for convenience

❌ **DON'T:**
- Never share your private key
- Don't commit SSH keys to repositories
- Don't use the same key across all services
- Don't skip the passphrase (though we did for simplicity)

## 🆘 Troubleshooting

### "Permission denied (publickey)"

1. Make sure you added the key to GitLab
2. Test connection: `ssh -T git@gitlab.com`
3. Check if ssh-agent is running: `Get-Service ssh-agent`
4. Add key to agent: `ssh-add "$env:USERPROFILE\.ssh\id_ed25519"`

### "Could not open a connection to your authentication agent"

```powershell
# Start the ssh-agent service
Start-Service ssh-agent

# Then add your key
ssh-add "$env:USERPROFILE\.ssh\id_ed25519"
```

### "Bad owner or permissions" Error

```powershell
# Fix permissions on Windows
icacls "$env:USERPROFILE\.ssh\id_ed25519" /inheritance:r
icacls "$env:USERPROFILE\.ssh\id_ed25519" /grant:r "$env:USERNAME:R"
```

## 🎯 Next Steps

1. ✅ Copy your public key (see above)
2. ✅ Add it to GitLab: https://gitlab.com/-/profile/keys
3. ✅ Test connection: `ssh -T git@gitlab.com`
4. ✅ Update your repository remote to use SSH
5. ✅ Start using Git with SSH!

## 📚 Additional Resources

- [GitLab SSH Keys Documentation](https://docs.gitlab.com/ee/user/ssh.html)
- [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [SSH Key Best Practices](https://www.ssh.com/academy/ssh/keygen)

---

**Your Public Key (for easy copying):**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBe/QYCQqG/ZeORmplBvUXWF8IdVzp6uj35YFljmTqD/ your_email@example.com
```

**Add it here:** https://gitlab.com/-/profile/keys
