export type MicrobitEvent =
    | {
        type: "pin-change";
        pin: string;
        value: number;
        pinType: "digital" | "analog";
    }
    | { type: "led-change"; x: number; y: number; value: number }
    | { type: "button-press"; button: "A" | "B" | "AB" }
    | { type: "logo-touch"; state: "pressed" | "released" }
    | { type: "reset" };

type MicrobitEventCallback = (event: MicrobitEvent) => void;

export class MicrobitEventEmitter {
    private listeners: Set<MicrobitEventCallback> = new Set();

    subscribe(callback: MicrobitEventCallback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    emit(event: MicrobitEvent) {
        for (const cb of this.listeners) {
            cb(event);
        }
    }
}