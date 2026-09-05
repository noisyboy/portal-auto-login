chrome.storage.local.get(['portalState'], (result) => {
    const state = result.portalState;
    if (!state || !state.enabled || !state.profiles || state.profiles.length === 0) return;
    
    const profile = state.profiles[state.currentIndex];
    if (!profile.user || !profile.pass) return;

    console.log("[*] Hardened Universal Parser Running...");

    function simulateTyping(element, text) {
        element.value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 1. Locate only VISIBLE fields
    // Find the password field first, ignoring hidden inputs
    const passField = document.querySelector('input[type="password"]:not([type="hidden"])');
    let userField = null;

    if (passField && passField.form) {
        // Smart Heuristic: Get all visible inputs in the form
        const visibleInputs = Array.from(passField.form.querySelectorAll('input:not([type="hidden"])'));
        const passIndex = visibleInputs.indexOf(passField);
        
        // The username is almost always the visible text field immediately preceding the password
        if (passIndex > 0) {
            userField = visibleInputs[passIndex - 1];
        }
    }

    // Fallback if form structure is highly non-standard
    if (!userField) {
        userField = document.querySelector('input[type="text"]:not([type="hidden"]), input[type="email"]:not([type="hidden"])');
    }

    if (userField && passField) {
        simulateTyping(userField, profile.user);
        simulateTyping(passField, profile.pass);
        console.log("[+] Fired virtual keystrokes into visible fields.");

        // 2. Wait for native JS validation, then force the click
        setTimeout(() => {
            // Hunt for the submit button, prioritizing names like "ok" or types like "submit"
            let submitBtn = document.querySelector('button[type="submit"], input[type="submit"], input[name="ok"]');
            
            if (!submitBtn && passField.form) {
                // Find ANY visible button in the form as a fallback
                const allButtons = passField.form.querySelectorAll('button:not([type="hidden"]), input[type="button"]');
                for (let btn of allButtons) {
                    const text = (btn.innerText || btn.value || "").toLowerCase();
                    if (text.includes('login') || text.includes('submit') || text.includes('sign in')) {
                        submitBtn = btn;
                        break;
                    }
                }
            }

            // Force the execution
            if (submitBtn) {
                // Strip the disabled attribute if their JS is fighting us
                submitBtn.disabled = false; 
                console.log(`[+] Forcing click on button: ${submitBtn.name || 'unnamed'}`);
                
                // A true .click() fires their native onsubmit scripts and includes the button's POST payload
                submitBtn.click(); 
            } else if (passField.form) {
                console.log("[-] Button completely hidden. Falling back to form.submit()...");
                // If we absolutely must fall back, manually inject the missing "ok" parameter
                const hiddenOk = document.createElement('input');
                hiddenOk.type = 'hidden';
                hiddenOk.name = 'ok';
                hiddenOk.value = 'Login';
                passField.form.appendChild(hiddenOk);
                passField.form.submit();
            }
        }, 500); 
    } else {
        console.log("[-] Failed to safely map visible form fields.");
    }
});