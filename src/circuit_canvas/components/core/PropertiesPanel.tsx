import {
  CircuitElement,
  Wire,
  PropertiesPanelProps,
} from "@/circuit_canvas/types/circuit";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ColorPaletteDropdown,
  defaultColors,
} from "@/circuit_canvas/components/toolbar/customization/ColorPallete";
import { getLedNodePositions } from "@/circuit_canvas/utils/ledNodeMap";

export default function PropertiesPanel({
  selectedElement,
  wireColor,
  onElementEdit,
  onWireEdit,
  wires,
  getNodeById,
  onEditWireSelect,
  setOpenCodeEditor,
}: PropertiesPanelProps) {
  const [resistance, setResistance] = useState<number | null>(null);
  // Store resistance internally in ohms; expose a unit-aware UI (Ω / kΩ)
  const [resistanceUnit, setResistanceUnit] = useState<"ohm" | "kohm">("ohm");
  // Decoupled text input so switching unit doesn't change the shown number
  const [resistanceInput, setResistanceInput] = useState<string>("");
  const [voltage, setVoltage] = useState<number | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [brightness, setBrightness] = useState<number | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [selectedWireColor, setSelectedWireColor] = useState<string>(
    wireColor || defaultColors[0].hex
  );
  const [showUpdateMessage, setShowUpdateMessage] = useState(false);

  // Gesture control
  const [showGesturePanel, setShowGesturePanel] = useState(false);
  const [selectedGesture, setSelectedGesture] = useState("");

  // Parse numeric input safely: empty string => null, invalid => null
  const parseNumber = (v: string): number | null => {
    if (v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const handleGestureSelect = (gesture: string) => {
    setSelectedGesture(gesture);
    setShowGesturePanel(false);

    if (onElementEdit && selectedElement) {
      const updatedElement = {
        ...selectedElement,
        properties: {
          ...selectedElement.properties,
          gesture,
        },
      };
      onElementEdit(updatedElement, false);
    }
  };

  // Whether this element wants to show a given property
  const showProp = (
    name:
      | "resistance"
      | "voltage"
      | "ratio"
      | "temperature"
      | "brightness"
      | "color"
  ) =>
    !selectedElement?.displayProperties ||
    selectedElement.displayProperties.includes(name);

  useEffect(() => {
    if (!selectedElement) return;
    setResistance(selectedElement.properties?.resistance ?? null);

    // Only initialize the displayed unit and text input when the user selects
    // a different element. This prevents the panel from overriding the user's
    // chosen unit (Ω vs kΩ) when the same element is updated elsewhere.
    const isNewSelection = lastSelectedIdRef.current !== selectedElement.id;
    const r = selectedElement.properties?.resistance;
    if (isNewSelection) {
      if (r != null) {
        setResistanceUnit(r >= 1000 ? "kohm" : "ohm");
        setResistanceInput((r >= 1000 ? r / 1000 : r).toString());
      } else {
        setResistanceUnit("ohm");
        setResistanceInput("");
      }
    }
    setVoltage(selectedElement.properties?.voltage ?? null);
    setRatio(selectedElement.properties?.ratio ?? null);
    setTemperature(selectedElement.properties?.temperature ?? null);
    setBrightness(selectedElement.properties?.brightness ?? null);
    setColor(selectedElement.properties?.color ?? null);
    lastSelectedIdRef.current = selectedElement.id;
  }, [selectedElement]);

  // Track last selected element id so we don't reinitialize unit/input on prop updates
  const lastSelectedIdRef = useRef<string | null>(null);

  // Keep wire color in sync with prop updates from parent
  useEffect(() => {
    setSelectedWireColor(wireColor || defaultColors[0].hex);
  }, [wireColor]);

  if (!selectedElement) return null;

  const handleUpdate = () => {
    if (selectedElement.type === "wire") {
      const wireToUpdate = wires.find((w) => w.id === selectedElement.id);
      if (wireToUpdate) {
        onWireEdit({ ...wireToUpdate, color: selectedWireColor }, false);
      }
    } else {
      // Build properties, but lock certain components (battery, lightbulb)
      const nextProps: NonNullable<CircuitElement["properties"]> = {
        ...selectedElement.properties,
        resistance: resistance ?? undefined,
        voltage: voltage ?? undefined,
        ratio: ratio ?? undefined,
        temperature: temperature ?? undefined,
        brightness: brightness ?? undefined,
        color: color ?? undefined,
        gesture: selectedGesture || selectedElement.properties?.gesture,
      };

      if (selectedElement.type === "battery") {
        // Enforce fixed battery values
        nextProps.voltage = 9;
        nextProps.resistance = 1.45;
      }
      if (selectedElement.type === "lightbulb") {
        // Enforce fixed bulb resistance
        nextProps.resistance = 48;
      }

      let updatedElement: CircuitElement = {
        ...selectedElement,
        properties: nextProps,
      };

      // For resistor, update node positions inline  similar to LED mapping
      if (selectedElement.type === "resistor") {
        const r = resistance ?? selectedElement.properties?.resistance ?? 5;
        const eps = 1e-6;
        const key =
          Math.abs(r - 5) < eps ? "5ohm" :
            Math.abs(r - 10) < eps ? "10ohm" :
              Math.abs(r - 15) < eps ? "15ohm" :
                Math.abs(r - 20) < eps ? "20ohm" :
                  Math.abs(r - 25) < eps ? "25ohm" :
                    Math.abs(r - 5000) < eps ? "5kohm" :
                      Math.abs(r - 10000) < eps ? "10kohm" :
                        Math.abs(r - 15000) < eps ? "15kohm" :
                          Math.abs(r - 20000) < eps ? "20kohm" :
                            Math.abs(r - 25000) < eps ? "25kohm" :
                              "5ohm";

        const nodeMap: Record<string, { left: { x: number; y: number }; right: { x: number; y: number } }> = {
          "5ohm": { left: { x: 4, y: 35.5 }, right: { x: 96, y: 35.5 } },
          "10ohm": { left: { x: 4, y: 36.5 }, right: { x: 96, y: 36.5 } },
          "15ohm": { left: { x: 4, y: 37.5 }, right: { x: 96, y: 37.2 } },
          "20ohm": { left: { x: 5, y: 36 }, right: { x: 96, y: 36.2 } },
          "25ohm": { left: { x: 4, y: 34.5 }, right: { x: 96, y: 34.5 } },
          "5kohm": { left: { x: 4, y: 35.5 }, right: { x: 96, y: 35.5 } },
          "10kohm": { left: { x: 4, y: 35.5 }, right: { x: 96, y: 35.5 } },
          "15kohm": { left: { x: 4, y: 34.5 }, right: { x: 96, y: 34.5 } },
          "20kohm": { left: { x: 4, y: 35 }, right: { x: 96, y: 35 } },
          "25kohm": { left: { x: 4, y: 35.5 }, right: { x: 96, y: 35.5 } },
        };
        const pos = nodeMap[key];
        const node1 = selectedElement.nodes.find((n) => n.id.endsWith("-node-1")) || selectedElement.nodes[0];
        const node2 = selectedElement.nodes.find((n) => n.id.endsWith("-node-2")) || selectedElement.nodes[1];
        if (node1 && node2) {
          updatedElement = {
            ...updatedElement,
            nodes: [
              { ...node1, x: pos.left.x, y: pos.left.y },
              { ...node2, x: pos.right.x, y: pos.right.y },
            ],
          };
        }
      }

      // For LED, update node positions when color changes so cathode/anode pins align with the artwork per color
      if (selectedElement.type === "led") {
        const pos = getLedNodePositions(color ?? selectedElement.properties?.color ?? "red");
        const cathode = selectedElement.nodes.find((n) => n.id.endsWith("-node-1")) || selectedElement.nodes[0];
        const anode = selectedElement.nodes.find((n) => n.id.endsWith("-node-2")) || selectedElement.nodes[1];
        if (cathode && anode) {
          updatedElement = {
            ...updatedElement,
            nodes: [
              { ...cathode, x: pos.cathode.x, y: pos.cathode.y },
              { ...anode, x: pos.anode.x, y: pos.anode.y },
            ],
          };
        }
      }
      onElementEdit(updatedElement, false);
    }

    setShowUpdateMessage(true);
    setTimeout(() => setShowUpdateMessage(false), 2000);
  };

  const handleDelete = () => {
    if (selectedElement.type === "wire") {
      const wireToDelete = wires.find((w) => w.id === selectedElement.id);
      if (wireToDelete) onWireEdit(wireToDelete, true);
    } else {
      onElementEdit(selectedElement, true);
    }
  };

  const connectedWires = wires.filter(
    (w) =>
      w.fromNodeId.startsWith(selectedElement.id) ||
      w.toNodeId.startsWith(selectedElement.id)
  );

  const effResistanceText = useMemo(() => {
    if (ratio == null || resistance == null) return "--";
    const val = ratio * resistance;
    return Number.isFinite(val) ? val.toFixed(2) : "--";
  }, [ratio, resistance]);

  return (
    <div className="backdrop-blur-sm bg-white/10 bg-clip-padding border border-gray-300 shadow-2xl rounded-xl text-sm p-2 space-y-1.5 max-w-xs">
      <div className="text-sm text-shadow-md text-gray-950 space-y-1">
        <div className="flex justify-between">
          <span className="font-semibold">Type:</span>
          <span>{selectedElement.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">ID:</span>
          <span className="text-blue-500 font-semibold truncate">
            {selectedElement.id}
          </span>
        </div>
      </div>

      {(selectedElement.type === "microbit" || selectedElement.type === "microbitWithBreakout") && (
        <button
          className="bg-blue-500 text-white text-xs px-1 py-1 rounded w-full"
          onClick={() => setOpenCodeEditor(true)}
        >
          Open Code Editor
        </button>
      )}

      {/* Numeric fields — never show for wires */}
      {selectedElement.type !== "wire" && selectedElement.type !== "battery" && selectedElement.type !== "lightbulb" && showProp("resistance") && (
        <div className="flex flex-col text-xs">
          <label>Resistance:</label>
          <div className="flex items-stretch gap-1">
            <input
              type="number"
              value={resistanceInput}
              onChange={(e) => {
                const raw = e.target.value;
                setResistanceInput(raw);
                if (raw === "") {
                  setResistance(null);
                  return;
                }
                const n = Number(raw);
                if (!Number.isFinite(n)) {
                  setResistance(null);
                  return;
                }
                // Update internal ohms for previews (eff. resistance), persistence still happens on Update
                setResistance(resistanceUnit === "kohm" ? n * 1000 : n);
              }}
              className="border px-1 py-1 rounded text-xs w-full"
            />
            <select
              className="border px-1 py-1 rounded text-xs bg-white"
              value={resistanceUnit}
              onChange={(e) => {
                const next = (e.target.value as "ohm" | "kohm");
                setResistanceUnit(next);
                // Do not change the displayed number when switching unit,
                // but keep internal ohms consistent for preview calculations
                if (resistanceInput !== "") {
                  const n = Number(resistanceInput);
                  if (Number.isFinite(n)) {
                    setResistance(next === "kohm" ? n * 1000 : n);
                  }
                }
              }}
            >
              <option value="ohm">Ω</option>
              <option value="kohm">kΩ</option>
            </select>
          </div>
        </div>
      )}

      {selectedElement.type !== "wire" && selectedElement.type !== "battery" && showProp("voltage") && (
        <div className="flex flex-col text-xs">
          <label>Voltage (V):</label>
          <input
            type="number"
            value={voltage ?? ""}
            onChange={(e) => setVoltage(parseNumber(e.target.value))}
            className="border px-1 py-1 rounded text-xs"
          />
        </div>
      )}

      {selectedElement.type !== "wire" && showProp("ratio") && (
        <div className="flex flex-col text-xs">
          <label>Ratio:</label>
          <input
            type="number"
            step="0.01"
            value={ratio ?? ""}
            onChange={(e) => setRatio(parseNumber(e.target.value))}
            className="border px-1 py-1 rounded text-xs"
          />
          <span className="text-gray-500 mt-1">
            Eff. Resistance: {effResistanceText} Ω
          </span>
        </div>
      )}

      {/* LED-specific color */}
      {selectedElement.type === "led" && showProp("color") && (
        <div className="flex flex-col text-xs">
          <label>LED Color:</label>
          <select
            value={color ?? "red"}
            onChange={(e) => setColor(e.target.value)}
            className="border px-1 py-1 rounded text-xs bg-white"
          >
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
            <option value="white">White</option>
            <option value="orange">Orange</option>
          </select>
        </div>
      )}

      {/* Micro:bit-specific controls */}
      {(selectedElement.type === "microbit" || selectedElement.type === "microbitWithBreakout") && showProp("temperature") && (
        <div className="flex flex-col text-xs">
          <label>Temperature (°C):</label>
          <input
            type="range"
            min="-5"
            max="50"
            value={temperature ?? 0}
            onChange={(e) => setTemperature(parseNumber(e.target.value) ?? 0)}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            {temperature ?? 0}°C
          </div>
        </div>
      )}

      {(selectedElement.type === "microbit" || selectedElement.type === "microbitWithBreakout") && showProp("brightness") && (
        <div className="flex flex-col text-xs">
          <label>Brightness (0–255):</label>
          <input
            type="range"
            min="0"
            max="255"
            value={brightness ?? 0}
            onChange={(e) => setBrightness(parseNumber(e.target.value) ?? 0)}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            {brightness ?? 0}
          </div>

          {/* Gesture Section */}
          <div className="mt-2">
            <label>Gesture:</label>
            <button
              className="bg-purple-200 hover:bg-purple-300 text-xs px-2 py-1 rounded mt-1 ms-1"
              onClick={() => setShowGesturePanel(!showGesturePanel)}
            >
              {selectedGesture
                ? `Selected: ${selectedGesture}`
                : "Choose Gesture"}
            </button>

            {showGesturePanel && (
              <div className="grid grid-cols-2 gap-2 mt-2 bg-purple-50 p-2 rounded">
                {[
                  "shake",
                  "logo up",
                  "logo down",
                  "screen up",
                  "screen down",
                  "tilt left",
                  "tilt right",
                  "free fall",
                  "3g",
                  "6g",
                  "8g",
                ].map((gesture) => (
                  <button
                    key={gesture}
                    className={`px-2 py-1 rounded text-xs border ${selectedGesture === gesture
                        ? "bg-purple-400 text-white"
                        : "bg-white"
                      }`}
                    onClick={() => handleGestureSelect(gesture)}
                  >
                    {gesture}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wire-specific color */}
      {selectedElement.type === "wire" && (
        <div className="flex flex-col text-xs">
          <label>Wire Color:</label>
          <ColorPaletteDropdown
            colors={defaultColors}
            selectedColor={selectedWireColor}
            onColorSelect={(c) => setSelectedWireColor(c)}
          />
        </div>
      )}

      <div className="flex justify-between gap-2 text-xs">
        {Array.isArray(selectedElement.displayProperties) &&
          selectedElement.displayProperties.length > 0 && (
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded w-full"
              onClick={handleUpdate}
            >
              Update
            </button>
          )}
        <button
          className="bg-red-500 text-white px-3 py-1 rounded w-full"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>

      {connectedWires.length > 0 && (
        <div className="mt-2">
          <h3 className="text-xs font-semibold text-gray-600 mb-1">
            Connected Wires
          </h3>
          <ul className="space-y-1 text-xs">
            {connectedWires.map((wire) => (
              <li
                key={wire.id}
                className="flex justify-between items-center px-2 py-1 rounded bg-white border hover:bg-blue-100"
              >
                <span className="truncate font-mono text-gray-800">
                  {wire.id}
                  <span className="text-gray-400 ml-1">
                    (
                    {defaultColors.find((c) => c.hex === wire.color)?.name ||
                      "Custom"}
                    )
                  </span>
                </span>
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => onEditWireSelect?.(wire)}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showUpdateMessage && (
        <div className="fixed bottom-7 right-3 z-10">
          <div className="flex items-center gap-2 backdrop-blur-sm bg-white/1 border-2 border-green-500 text-green-800 px-1 py-1 rounded shadow-2xl animate-slide-in-up text-md">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>
              {selectedElement.type.charAt(0).toUpperCase() +
                selectedElement.type.slice(1)}{" "}
              updated!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
