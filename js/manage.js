/**
 * Isiwara Aura - Advanced Room Allocation & Group Locking Engine
 */

class RoomAllocationEngine {
    constructor() {
        this.rooms = [
            { id: 'R1', type: 'normal', beds: 3, occupied: 0, locked: false, guests: [] },
            { id: 'R2', type: 'normal', beds: 3, occupied: 0, locked: false, guests: [] },
            { id: 'R3', type: 'normal', beds: 3, occupied: 0, locked: false, guests: [] },
            { id: 'R4', type: 'normal', beds: 3, occupied: 0, locked: false, guests: [] },
            { id: 'R5', type: 'normal', beds: 3, occupied: 0, locked: false, guests: [] },
            { id: 'R6', type: 'normal', beds: 1, occupied: 0, locked: false, guests: [] },
            { id: 'R7', type: 'normal', beds: 1, occupied: 0, locked: false, guests: [] },
            { id: 'R8', type: 'shirodhara', beds: 3, shirodharaBeds: 2, normalBeds: 1, occupied: 0, locked: false, guests: [] },
            { id: 'R9', type: 'shirodhara', beds: 3, shirodharaBeds: 3, normalBeds: 0, occupied: 0, locked: false, guests: [] },
        ];
        this.changingRooms = [
            { id: 'CR1', occupied: false, guestId: null, startTime: null },
            { id: 'CR2', occupied: false, guestId: null, startTime: null }
        ];
    }

    /**
     * Allocate Room Matrix - Group Isolation & Lock Routines
     * @param {Object} guest - Base configuration profile metrics
     * @param {Array} guestsInGroup - Full cluster tracking slice array
     */
    allocateRoom(guest, guestsInGroup = []) {
        console.log(`Allocation Request Received for Guest: ${guest.name}. Group Size: ${guestsInGroup.length}`);
        
        // Handle Group Locks
        if (guestsInGroup.length >= 2) {
            const suitableRoom = this.findRoomWithConsecutiveBeds(guestsInGroup.length, guest.treatmentType);
            
            if (!suitableRoom) {
                return { success: false, message: 'No contiguous block available for this group configuration. Please hold or split records.' };
            }
            
            const selectedBedNumbers = [];
            const occupiedBeds = suitableRoom.guests.map(g => g.bedNumber);
            
            for (let b = 1; b <= suitableRoom.beds; b++) {
                if (!occupiedBeds.includes(b) && selectedBedNumbers.length < guestsInGroup.length) {
                    selectedBedNumbers.push(b);
                }
            }

            this.lockRoomForGroup(suitableRoom.id, guestsInGroup, selectedBedNumbers);
            
            return { 
                success: true, 
                roomId: suitableRoom.id, 
                bedNumbers: selectedBedNumbers,
                message: `Room ${suitableRoom.id} securely isolated for group of ${guestsInGroup.length}. Room locked until final discharge.` 
            };
        }
        
        // Handle Single Guest Allocations
        const singleBed = this.findSingleAvailableBed(guest.treatmentType);
        if (!singleBed) {
            return { success: false, message: 'All target operational structural beds currently saturated. Guest redirected to retention queue.' };
        }
        
        this.markBedAsOccupied(singleBed.roomId, singleBed.bedNumber, guest);
        
        return { 
            success: true, 
            roomId: singleBed.roomId, 
            bedNumber: singleBed.bedNumber,
            message: `Spatial unit assignment stable. Room ${singleBed.roomId}, Bed ${singleBed.bedNumber} locked.` 
        };
    }

    findRoomWithConsecutiveBeds(requiredBeds, treatmentType) {
        const eligibleRooms = this.rooms.filter(room => {
            if (treatmentType === 'shirodhara') {
                return room.type === 'shirodhara' && (room.beds - room.occupied) >= requiredBeds;
            }
            return room.type === 'normal' && (room.beds - room.occupied) >= requiredBeds;
        });
        
        for (const room of eligibleRooms) {
            if (!room.locked && (room.beds - room.occupied) >= requiredBeds) {
                return room;
            }
        }
        return null;
    }

    findSingleAvailableBed(treatmentType) {
        for (const room of this.rooms) {
            if (room.type === treatmentType && !room.locked && room.occupied < room.beds) {
                const occupiedBeds = room.guests.map(g => g.bedNumber);
                for (let bedNum = 1; bedNum <= room.beds; bedNum++) {
                    if (!occupiedBeds.includes(bedNum)) {
                        return { roomId: room.id, bedNumber: bedNum };
                    }
                }
            }
        }
        return null;
    }

    lockRoomForGroup(roomId, guestsInGroup, assignedBeds) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) return;

        room.locked = true;
        guestsInGroup.forEach((g, idx) => {
            room.guests.push({
                guestId: g.id,
                name: g.name,
                bedNumber: assignedBeds[idx],
                status: 'IN_PROGRESS',
                startTime: new Date()
            });
        });
        room.occupied = room.guests.length;

        if (typeof dispatchPatchRESTRequestHandshake === 'function' && localStorage.getItem('BASE_ID')) {
            dispatchPatchRESTRequestHandshake('Rooms', roomId, { Locked: true, CurrentOccupancy: room.occupied }).catch(err => {
                console.error("Airtable structural locking synchronization sync failed:", err);
            });
        }
    }

    markBedAsOccupied(roomId, bedNumber, guest) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) return;

        room.guests.push({
            guestId: guest.id,
            name: guest.name,
            bedNumber: bedNumber,
            status: 'IN_PROGRESS',
            startTime: new Date()
        });
        room.occupied = room.guests.length;
    }

    unlockRoomIfLastGuestCompletes(roomId, completingGuestId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room || !room.locked) return { unlocked: false };
        
        room.guests = room.guests.filter(g => g.guestId !== completingGuestId);
        room.occupied = room.guests.length;
        
        if (room.guests.length === 0) {
            room.locked = false;
            
            if (typeof dispatchPatchRESTRequestHandshake === 'function' && localStorage.getItem('BASE_ID')) {
                dispatchPatchRESTRequestHandshake('Rooms', roomId, { Locked: false, CurrentOccupancy: 0 });
            }
            return { unlocked: true, message: `Room ${roomId} fully unlocked. All group elements discharged safely.` };
        }
        
        return { unlocked: false, message: `Room ${roomId} holding group structural lock. ${room.guests.length} members remaining in treatment execution window.` };
    }

    allocateChangingRoom(guestId) {
        const freeRoom = this.changingRooms.find(cr => !cr.occupied);
        if (!freeRoom) return { success: false, message: 'All spatial layout changing vectors saturated. Please hold.' };
        
        freeRoom.occupied = true;
        freeRoom.guestId = guestId;
        freeRoom.startTime = new Date();
        
        setTimeout(() => { this.checkChangingRoomTimeout(freeRoom.id); }, 5 * 60 * 1000);
        return { success: true, changingRoomId: freeRoom.id, message: 'Changing Unit allocated. Maximum execution window capped at 5 minutes.' };
    }

    checkChangingRoomTimeout(changingRoomId) {
        const cr = this.changingRooms.find(c => c.id === changingRoomId);
        if (cr && cr.occupied) {
            const elapsed = Date.now() - cr.startTime.getTime();
            if (elapsed >= 5 * 60 * 1000) {
                console.warn(`🚨 TIMEOUT EXCEEDED: Spatial Unit ${changingRoomId} occupied by Guest ${cr.guestId} outside maximum bounds.`);
                if (typeof triggerCustomSwalNotification === 'function') {
                    triggerCustomSwalNotification("Changing Room Timeout", `Unit ${changingRoomId} has exceeded its 5-minute allocation ceiling.`, "error");
                }
            }
        }
    }
}

// Global Export without Node Module wrapper architecture constraints
window.roomAllocationEngine = new RoomAllocationEngine();
