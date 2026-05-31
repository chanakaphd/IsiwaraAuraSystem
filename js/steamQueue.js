/**
 * Isiwara Aura - Steam Bath Queue Engine (M/M/c Framework Core)
 */

class SteamBathQueueEngine {
    constructor() {
        this.steamRooms = [
            { id: 'SR1', occupied: false, guestId: null, startTime: null, endTime: null },
            { id: 'SR2', occupied: false, guestId: null, startTime: null, endTime: null }
        ];
        this.queue = [];
        this.history = [];
    }

    requestSteamBath(guest, treatmentCompletedRoomId) {
        const freeRoom = this.steamRooms.find(sr => !sr.occupied);
        
        if (freeRoom) {
            return this.assignSteamRoom(freeRoom, guest, treatmentCompletedRoomId);
        }
        
        const estimatedWaitTime = this.calculateEstimatedWaitTime();
        const queueEntry = {
            guestId: guest.id,
            guestName: guest.name,
            treatmentCompletedRoomId: treatmentCompletedRoomId,
            requestedTime: new Date(),
            estimatedWaitTime: estimatedWaitTime,
            queuePosition: this.queue.length + 1,
            status: 'WAITING'
        };
        
        this.queue.push(queueEntry);
        
        if (typeof dispatchPostRESTRequestHandshake === 'function' && localStorage.getItem('BASE_ID')) {
            dispatchPostRESTRequestHandshake('SteamBathQueue', {
                GuestId: guest.id,
                GuestName: guest.name,
                QueuePosition: queueEntry.queuePosition,
                EstimatedWait: estimatedWaitTime
            });
        }

        return {
            success: true,
            assigned: false,
            queuePosition: queueEntry.queuePosition,
            estimatedWaitTime: estimatedWaitTime,
            message: `Steam capacity saturated. Queue slot reserved at baseline position ${queueEntry.queuePosition}. Dynamic expected delay: ${estimatedWaitTime} min.`
        };
    }

    assignSteamRoom(steamRoom, guest, treatmentCompletedRoomId) {
        const duration = 20; // Hard limit allocation criteria
        steamRoom.occupied = true;
        steamRoom.guestId = guest.id;
        steamRoom.startTime = new Date();
        steamRoom.endTime = new Date(Date.now() + duration * 60 * 1000);

        const assignment = {
            steamRoomId: steamRoom.id,
            guestId: guest.id,
            guestName: guest.name,
            treatmentCompletedRoomId: treatmentCompletedRoomId,
            startTime: steamRoom.startTime,
            endTime: steamRoom.endTime,
            status: 'IN_PROGRESS'
        };

        if (typeof dispatchPostRESTRequestHandshake === 'function' && localStorage.getItem('BASE_ID')) {
            dispatchPostRESTRequestHandshake('SteamBathAssignments', {
                RoomId: steamRoom.id,
                GuestId: guest.id,
                GuestName: guest.name,
                Duration: duration,
                Status: 'IN_PROGRESS'
            });
        }

        this.startSteamBathTimer(steamRoom.id, steamRoom.endTime, guest.id);

        return {
            success: true,
            assigned: true,
            steamRoomId: steamRoom.id,
            message: `Steam Unit ${steamRoom.id} unlocked. 20-minute clean execution stream initialized.`
        };
    }

    calculateEstimatedWaitTime() {
        const queueLength = this.queue.length;
        const occupiedRooms = this.steamRooms.filter(sr => sr.occupied);
        const serviceTime = 20;

        if (occupiedRooms.length === 2) {
            const remainingTimes = occupiedRooms.map(sr => Math.ceil((sr.endTime.getTime() - Date.now()) / 60000));
            const earliestFreeTime = Math.min(...remainingTimes);
            return Math.max(0, earliestFreeTime) + (queueLength * (serviceTime / 2));
        }
        return 0;
    }

    startSteamBathTimer(roomId, endTime, guestId) {
        const interval = setInterval(() => {
            const remaining = endTime.getTime() - Date.now();
            if (remaining <= 0) {
                clearInterval(interval);
                this.handleSteamBathCompletion(roomId, guestId);
            }
        }, 15000);
    }

    handleSteamBathCompletion(roomId, guestId) {
        const steamRoom = this.steamRooms.find(sr => sr.id === roomId);
        if (!steamRoom) return;

        steamRoom.occupied = false;
        steamRoom.guestId = null;
        steamRoom.startTime = null;
        steamRoom.endTime = null;

        console.log(`Steam operation complete on unit index: ${roomId}`);

        if (this.queue.length > 0) {
            const nextGuest = this.queue.shift();
            this.updateQueuePositions();
            this.assignSteamRoom(steamRoom, { id: nextGuest.guestId, name: nextGuest.guestName }, nextGuest.treatmentCompletedRoomId);
            
            if (typeof triggerCustomSwalNotification === 'function') {
                triggerCustomSwalNotification("Steam Queue Advance", `Unit ${roomId} parsed. Advancing Guest: ${nextGuest.guestName} from pipeline queue.`, "success");
            }
        }
    }

    updateQueuePositions() {
        this.queue.forEach((entry, idx) => {
            entry.queuePosition = idx + 1;
        });
    }

    getQueueStatus() {
        return {
            steamRooms: this.steamRooms,
            queue: this.queue,
            totalWaiting: this.queue.length
        };
    }
}

window.steamBathQueueEngine = new SteamBathQueueEngine();
