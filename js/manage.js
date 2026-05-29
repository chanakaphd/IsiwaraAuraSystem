/**
 * Isiwara Aura - Manage Flow Live Operations State Machine Controller
 */

// Tracking index for active modal context operations
window.currentInterventionNodeIndex = null;

/**
 * Renders the active layout and tracking cards for running treatment instances.
 */
function drawLiveManagementInterfaceBoard() {
    const container = document.getElementById('live-timers-container');
    if (!container) return;

    if (localLiveTimerQueueDatabase.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-4 font-monospace">Operational pipelines empty. Execute transaction at Intake Window to launch counters.</div>';
        return;
    }

    // Dynamic resource arrays to compute exclusion logic inside POS module windows
    let lockedStaffNames = [];
    let lockedRoomNames = [];

    container.innerHTML = localLiveTimerQueueDatabase.map((node, index) => {
        let labelString = formatSecondsToMinutesString(node.countdownSeconds);
        let currentStatusTheme = "bg-success text-white border-success"; 
        let contextFlag = "LIVE MASSAGE";

        // Evaluate chronological states to format themes dynamically
        if (node.statusState === 'PREPARATION') {
            currentStatusTheme = "bg-warning text-dark border-warning"; 
            contextFlag = "PREP BUFFER";
            lockedStaffNames.push(node.therapistLabel); 
            lockedRoomNames.push(node.roomLabel);
        } else if (node.statusState === 'MASSAGE') {
            lockedStaffNames.push(node.therapistLabel); 
            lockedRoomNames.push(node.roomLabel);
        } else if (node.statusState === 'ACTIVE_SPECIAL') {
            labelString = formatSecondsToMinutesString(node.specialTimeRemaining);
            currentStatusTheme = "bg-info text-white border-info"; 
            contextFlag = node.specialRoomType.toUpperCase().replace('_', ' ');
        } else if (node.statusState === 'WAITING_SPECIAL') {
            currentStatusTheme = "bg-light text-dark border-secondary"; 
            contextFlag = "TEA LOUNGE"; 
            labelString = "QUEUED";
        }

        return `
            <div class="col-md-6 animate-fade-in">
                <div class="card p-3 border-start border-4 ${currentStatusTheme.split(' ')[2]} shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h6 class="fw-bold mb-0 text-success">${node.guestName}</h6>
                            <small>${node.treatmentName} • <strong>${node.roomLabel}</strong></small>
                        </div>
                        <div class="timer-badge ${currentStatusTheme.split(' ')[0]} ${currentStatusTheme.split(' ')[1]} shadow-sm">
                            ${contextFlag}: ${labelString}
                        </div>
                    </div>
                    <div class="small text-muted mb-2">Locked Staff Specialist: <strong>${node.therapistLabel}</strong></div>
                    <div class="d-flex gap-2 justify-content-end border-top pt-2">
                        <button class="btn btn-xs btn-sm btn-outline-danger" style="font-size:11px;" onclick="abortAndRefundActiveSession(${index})">Stop Session</button>
                        ${node.statusState === 'PREPARATION' ? `<button class="btn btn-xs btn-sm btn-warning" style="font-size:11px;" onclick="bypassPrepAndStartMassage(${index})">Skip Prep</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Write current resource locks into session context maps to prevent double-bookings
    sessionStorage.setItem('activeLockedStaff', JSON.stringify(lockedStaffNames));
    sessionStorage.setItem('activeLockedRooms', JSON.stringify(lockedRoomNames));

    renderQueueWaitingPoolsUI();
}

/**
 * Heartbeat ticker cycle firing every 1000ms from the global core clock frame.
 */
function tickLiveCountdownTimersEngine() {
    let UI_RefreshNeeded = false;

    localLiveTimerQueueDatabase.forEach((node, index) => {
        // Handle Primary Treatment Countdown Frames
        if (node.countdownSeconds > 0 && (node.statusState === 'PREPARATION' || node.statusState === 'MASSAGE')) {
            node.countdownSeconds--; 
            UI_RefreshNeeded = true;
            
            if (node.countdownSeconds === 0) {
                if (node.statusState === 'PREPARATION') {
                    node.statusState = 'MASSAGE'; 
                    node.countdownSeconds = node.totalMassageDuration;
                } else if (node.statusState === 'MASSAGE') {
                    node.statusState = 'COMPLETED_INTERVENTION_AWAITING';
                    if (typeof triggerNativeAudioHardwareBeep === 'function') {
                        triggerNativeAudioHardwareBeep();
                    }
                    launchCompletionModalWizardIntersection(index);
                }
            }
        }
        
        // Handle Post-Massage Secondary Special Asset Countdown Frames
        if (node.statusState === 'ACTIVE_SPECIAL' && node.specialTimeRemaining > 0) {
            node.specialTimeRemaining--; 
            UI_RefreshNeeded = true;
            
            if (node.specialTimeRemaining === 0) {
                node.statusState = 'COMPLETE_FINAL';
                clearSpecialRoomLockMapping(node.specialRoomType);
            }
        }
    });

    if (UI_RefreshNeeded && document.getElementById('manage-view').style.display !== 'none') {
        drawLiveManagementInterfaceBoard();
    }
}

/**
 * Intercepts operator workflows when a session countdown finishes.
 * @param {number} idx - Index references inside the background running clock database
 */
function launchCompletionModalWizardIntersection(idx) {
    currentInterventionNodeIndex = idx;
    const node = localLiveTimerQueueDatabase[idx];
    
    document.getElementById('lblCompGuestName').innerText = node.guestName;
    document.getElementById('lblCompRoomLabel').innerText = node.roomLabel;
    document.getElementById('lblCompTherapistLabel').innerText = node.therapistLabel;
    
    // Bind click handshake logic to modal command buttons
    document.getElementById('btnCompWait10').onclick = () => {
        node.statusState = 'MASSAGE'; 
        node.countdownSeconds = 600; // Inject a flat 10-minute buffer trace
        dismissCompletionModalBackdrop(); 
        drawLiveManagementInterfaceBoard();
    };

    document.getElementById('btnCompCancel').onclick = () => {
        node.statusState = 'COMPLETED_BYPASSED_STEAM';
        if (document.getElementById('chkUnlockResourcesOverride').checked) {
            clearResourceExclusionsLocks(node.roomLabel, node.therapistLabel);
        }
        dismissCompletionModalBackdrop(); 
        drawLiveManagementInterfaceBoard();
        if (typeof triggerCustomSwalNotification === 'function') {
            triggerCustomSwalNotification("Session Finalized", "Guest record successfully written and archived.");
        }
    };

    document.getElementById('btnCompConfirm').onclick = () => {
        if (document.getElementById('chkUnlockResourcesOverride').checked) {
            clearResourceExclusionsLocks(node.roomLabel, node.therapistLabel);
        }
        processPostMassageChamberSequencingRoute(node);
    };

    const modalBackdrop = document.getElementById('treatment-completion-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.add('show');
}

/**
 * Closes the completion wizard safely.
 */
function dismissCompletionModalBackdrop() {
    const modalBackdrop = document.getElementById('treatment-completion-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('show');
}

/**
 * Handles cascading priority rules routing to direct post-massage clients into steam facilities.
 * Priority: Alpha Chamber ➔ Beta Chamber ➔ Tea Lounge Queue
 * @param {Object} node - Operational runtime model block configuration references
 */
function processPostMassageChamberSequencingRoute(node) {
    const alphaStatus = document.getElementById('steam-room-1-status');
    const betaStatus = document.getElementById('steam-room-2-status');

    if (alphaStatus && alphaStatus.innerText.includes('Vacant')) {
        alphaStatus.innerText = `Occupied: ${node.guestName}`; 
        alphaStatus.className = "p-2 border rounded bg-danger text-white small fw-bold shadow-sm";
        node.specialRoomType = 'Steam_Alpha'; 
        node.statusState = 'ACTIVE_SPECIAL'; 
        node.specialTimeRemaining = 1200; // 20 Minutes standard session limit
        dismissCompletionModalBackdrop(); 
        drawLiveManagementInterfaceBoard();
        if (typeof triggerCustomSwalNotification === 'function') {
            triggerCustomSwalNotification("Asset Locked", "Chamber Alpha successfully assigned for 20 minutes.");
        }
    } else if (betaStatus && betaStatus.innerText.includes('Vacant')) {
        betaStatus.innerText = `Occupied: ${node.guestName}`; 
        betaStatus.className = "p-2 border rounded bg-danger text-white small fw-bold shadow-sm";
        node.specialRoomType = 'Steam_Beta'; 
        node.statusState = 'ACTIVE_SPECIAL'; 
        node.specialTimeRemaining = 1200;
        dismissCompletionModalBackdrop(); 
        drawLiveManagementInterfaceBoard();
        if (typeof triggerCustomSwalNotification === 'function') {
            triggerCustomSwalNotification("Asset Locked", "Chamber Beta successfully assigned for 20 minutes.");
        }
    } else {
        // Both units maxed out. Enforce fallback tea waiting lounge logic tracking indexes
        node.statusState = 'WAITING_SPECIAL'; 
        node.specialRoomType = 'Queue_Pool_Tea';
        dismissCompletionModalBackdrop(); 
        drawLiveManagementInterfaceBoard();
        alert("Proceed Delay Warning:\nPost-massage steam chambers are currently occupied. Client added to the tea waiting lounge backlog.");
    }
}

/**
 * Releases special asset locks and checks for waiting pool allocations.
 * @param {string} tag - Key identifying which chamber state triggered completion
 */
function clearSpecialRoomLockMapping(tag) {
    if (tag === 'Steam_Alpha') {
        const el = document.getElementById('steam-room-1-status'); 
        if (el) { el.innerText = 'Vacant'; el.className = "p-2 border rounded bg-white text-muted small"; }
    } else if (tag === 'Steam_Beta') {
        const el = document.getElementById('steam-room-2-status'); 
        if (el) { el.innerText = 'Vacant'; el.className = "p-2 border rounded bg-white text-muted small"; }
    }
    
    // Check if any clients are waiting in the tea queue to pull them into the vacant chamber
    const nextQueuedNode = localLiveTimerQueueDatabase.find(n => n.statusState === 'WAITING_SPECIAL');
    if (nextQueuedNode) {
        processPostMassageChamberSequencingRoute(nextQueuedNode);
    }
}

/**
 * Bypasses the 5-minute prep window and starts the core treatment block instantly.
 */
function bypassPrepAndStartMassage(idx) {
    localLiveTimerQueueDatabase[idx].statusState = 'MASSAGE';
    localLiveTimerQueueDatabase[idx].countdownSeconds = localLiveTimerQueueDatabase[idx].totalMassageDuration;
    drawLiveManagementInterfaceBoard();
}

/**
 * Stops an active session and wipes its tracking indexes.
 */
function abortAndRefundActiveSession(idx) {
    if (confirm("Stop active tracking parameters for this session line? Configuration variables will reset.")) {
        const node = localLiveTimerQueueDatabase[idx];
        clearResourceExclusionsLocks(node.roomLabel, node.therapistLabel);
        localLiveTimerQueueDatabase.splice(idx, 1); 
        drawLiveManagementInterfaceBoard();
    }
}

/**
 * Renders names inside the tea waiting queue display block.
 */
function renderQueueWaitingPoolsUI() {
    const pool = document.getElementById('queue-waiting-pool');
    if (!pool) return;
    
    const linedNodes = localLiveTimerQueueDatabase.filter(n => n.statusState === 'WAITING_SPECIAL');
    pool.innerHTML = linedNodes.map(g => `
        <div class="p-2 border-start border-3 border-danger bg-white small mb-1 rounded fw-bold text-dark animate-fade-in">
            ⏳ Client: ${g.guestName} (Lounge Line)
        </div>
    `).join('') || '<div class="text-muted small font-monospace">Chambers backlog optimal. No delays tracked.</div>';
}

/**
 * Clears data elements maps inside local structures.
 */
function clearResourceExclusionsLocks(roomLabel, therapistLabel) {
    let activeRooms = JSON.parse(sessionStorage.getItem('activeLockedRooms') || '[]');
    let activeStaff = JSON.parse(sessionStorage.getItem('activeLockedStaff') || '[]');
    
    activeRooms = activeRooms.filter(r => r !== roomLabel);
    activeStaff = activeStaff.filter(s => s !== therapistLabel);
    
    sessionStorage.setItem('activeLockedRooms', JSON.stringify(activeRooms));
    sessionStorage.setItem('activeLockedStaff', JSON.stringify(activeStaff));
}
