/**
 * Isiwara Aura - Operational Real-Time Dashboard Node Engine
 */

class OperatorDashboardConsole {
    constructor() {
        this.audioContext = null;
    }

    triggerCompletionSequenceAlert(guestName, roomId, bedNumber, assignmentId) {
        this.dispatchAudiblePingNotificationSequence();
        this.renderVisualInterventionModal(guestName, roomId, bedNumber, assignmentId);
    }

    dispatchAudiblePingNotificationSequence() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const dispatchBeepNode = (delayFrequency, durationMs) => {
                const osc = this.audioContext.createOscillator();
                const volumeNode = this.audioContext.createGain();
                
                osc.connect(volumeNode);
                volumeNode.connect(this.audioContext.destination);
                
                osc.frequency.value = delayFrequency;
                volumeNode.gain.value = 0.4;
                
                osc.start();
                setTimeout(() => osc.stop(), durationMs);
            };

            // Dispatch 3 distinct short structural beep matrices to attract physical attention
            dispatchBeepNode(880, 250);
            setTimeout(() => dispatchBeepNode(880, 250), 400);
            setTimeout(() => dispatchBeepNode(1200, 400), 800);
        } catch (audioException) {
            console.warn("Audible sound context blocked by device browser interaction policy restrictions.", audioException);
        }
    }

    renderVisualInterventionModal(guestName, roomId, bedNumber, assignmentId) {
        // Prevent duplicate instances filling display space
        const staleModal = document.getElementById('interventionOverlayContainer');
        if (staleModal) staleModal.remove();

        const nodeOverlay = document.createElement('div');
        nodeOverlay.id = "interventionOverlayContainer";
        nodeOverlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); backdrop-filter:blur(3px); z-index:10000; display:flex; align-items:center; justify-content:center;";

        nodeOverlay.innerHTML = `
            <div style="background:white; padding:30px; width:450px; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.25); border-top:8px solid #dc3545; text-align:center;" class="animate-fade-in">
                <h4 style="color:#dc3545; font-weight:800; margin-bottom:5px;">⚠️ OPERATION COMPLETION WINDOW</h4>
                <p style="color:#6c757d; font-size:13px;">Critical response directive tracking required. Action loop logged permanently.</p>
                <hr>
                <div style="background:#f8f9fa; padding:15px; border-radius:12px; margin-bottom:20px; text-align:left; font-size:14px;">
                    <strong>Guest Identity:</strong> ${guestName}<br>
                    <strong>Location Context:</strong> Room Unit ${roomId} [Bed Space ${bedNumber}]<br>
                    <strong>Tracking Key:</strong> <span style="font-family:monospace;">${assignmentId}</span>
                </div>
                <h6 style="font-weight:700; text-align:left; margin-bottom:10px;">Select Pipeline Directive Route:</h6>
                <button id="btnRouteSteam" style="width:100%; padding:11px; margin-bottom:8px; background:#1e4620; color:white; border:none; border-radius:8px; font-weight:700;">🚿 Route to Hydro-Steam Bath Matrix</button>
                <button id="btnRouteDepart" style="width:100%; padding:11px; margin-bottom:8px; background:#6c757d; color:white; border:none; border-radius:8px; font-weight:700;">🚶 System Checkout / Complete Departure</button>
                <button id="btnRouteNext" style="width:100%; padding:11px; background:#fd7e14; color:white; border:none; border-radius:8px; font-weight:700;">👤 Flag Bed Clear / Push Next Queue</button>
            </div>
        `;

        document.body.appendChild(nodeOverlay);

        // Bind interactive execution threads to global framework layers
        document.getElementById('btnRouteSteam').onclick = () => {
            if (window.steamBathQueueEngine) {
                const res = window.steamBathQueueEngine.requestSteamBath({ id: guestProfileId, name: guestName }, roomId);
                alert(res.message);
            }
            nodeOverlay.remove();
        };

        document.getElementById('btnRouteDepart').onclick = () => {
            if (window.roomAllocationEngine) {
                window.roomAllocationEngine.unlockRoomIfLastGuestCompletes(roomId, guestProfileId);
            }
            alert("Guest departure operations finalized cleanly.");
            nodeOverlay.remove();
        };

        document.getElementById('btnRouteNext').onclick = () => {
            alert("Bed allocation structural registers cleared. Next operational matrix entry triggered.");
            nodeOverlay.remove();
        };
    }
}

window.operatorDashboardConsole = new OperatorDashboardConsole();
