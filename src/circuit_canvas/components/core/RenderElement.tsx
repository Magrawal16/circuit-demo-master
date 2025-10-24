// RenderElement.tsx

import { useState } from "react";
import { CircuitElement, Wire } from "@/circuit_canvas/types/circuit";
import { Rect, Group, Text, Label, Tag } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { getElementCenter } from "@/circuit_canvas/utils/rotationUtils";
import { findConnectedMicrobit } from "@/circuit_canvas/utils/renderElementsUtils/microbitConnectivityUtils";
import Lightbulb from "@/circuit_canvas/components/elements/Lightbulb";
import Battery from "@/circuit_canvas/components/elements/Battery";
import Led from "@/circuit_canvas/components/elements/Led";
import Resistor from "@/circuit_canvas/components/elements/Resistor";
import Multimeter from "@/circuit_canvas/components/elements/Multimeter";
import Potentiometer from "@/circuit_canvas/components/elements/Potentiometer";
import Microbit from "@/circuit_canvas/components/elements/Microbit";
import UltraSonicSensor4P from "../elements/UltraSonicSensor4P";
import MicrobitWithBreakout from "../elements/MicrobitWithBreakout";
import PowerSupply from "@/circuit_canvas/components/elements/PowerSupply";

interface RenderElementProps {
  element: CircuitElement;
  simulator?: any;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  handleNodeClick: (nodeId: string) => void;
  handleRatioChange?: (elementId: string, ratio: number) => void;
  handleModeChange: (elementId: string, mode: "voltage" | "current" | "resistance") => void;
  onSelect?: (elementId: string) => void;
  selectedElementId?: string | null;
  onDragStart: () => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onControllerInput: (elementId: string, input: string) => void;
  isSimulationOn?: boolean;
  elements?: CircuitElement[];
  wires?: Wire[];
  // Toggle node hit targets/tooltips (for external node overlay layer)
  showNodes?: boolean;
  // Toggle rendering of the element's visual body; when false, only nodes/labels render
  showBody?: boolean;
}

export default function RenderElement({
  element,
  simulator,
  elements,
  wires,
  ...props
}: RenderElementProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const center = getElementCenter(element);

  // Get connected microbit data for ultrasonic sensor using utility function
  const connectedMicrobitData = element.type === "ultrasonicsensor4p" && elements && wires
    ? findConnectedMicrobit(element, elements, wires)
    : null;

  return (
    <Group
      x={element.x}
      y={element.y}
      offsetX={center.x}
      offsetY={center.y}
      rotation={element.rotation || 0}
      onDragMove={props.onDragMove}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
      onClick={() => props.onSelect?.(element.id)}
      id={element.id}
      // Only the body layer should be draggable, and not while simulation is running
      draggable={props.showBody !== false && !props.isSimulationOn}
    >
      {/* Render circuit elements (conditionally hidden in nodes-only overlay) */}
      {props.showBody !== false && element.type === "lightbulb" && (
        <Lightbulb
          id={element.id}
          x={0}
          y={0}
          power={element.computed?.power ?? 0}
          selected={props.selectedElementId === element.id}
        />
      )}
      {props.showBody !== false && element.type === "led" && (
        <Led
          id={element.id}
          x={0}
          y={0}
          power={element.computed?.power ?? 0}
          selected={props.selectedElementId === element.id}
          color={element.properties?.color as string | undefined}
        />
      )}
      {props.showBody !== false && element.type === "battery" && (
        <Battery
          id={element.id}
          x={0}
          y={0}
          selected={props.selectedElementId === element.id}
        />
      )}
      {props.showBody !== false && element.type === "powersupply" && (
        <PowerSupply
          id={element.id}
          x={0}
          y={0}
          selected={props.selectedElementId === element.id}
        />
      )}
      {props.showBody !== false && element.type === "resistor" && (
        <Resistor
          id={element.id}
          x={1}
          y={22}
          resistance={element.properties?.resistance}
          selected={props.selectedElementId === element.id}
          bandWidths={[2.6, 2.6, 2.6, 1.2]} // widths for each band
          bandHeights={[12.4, 10, 10, 12.2]} // heights for each band
          bandGaps={[3, 4, 6]} // gaps between bands
        />
      )}
      {props.showBody !== false && element.type === "multimeter" && (
        <Multimeter
          id={element.id}
          x={1}
          y={22}
          measurement={element.computed?.measurement}
          initialMode={(element.properties?.mode as any) ?? "voltage"}
          onModeChange={props.handleModeChange}
          isSimulationOn={props.isSimulationOn}
          selected={props.selectedElementId === element.id}
        />
      )}
      {props.showBody !== false && element.type === "potentiometer" && (
        <Potentiometer
          id={element.id}
          x={1}
          y={22}
          onRatioChange={(ratio) => {
            props.handleRatioChange?.(element.id, ratio);
          }}
          resistance={element.properties?.resistance ?? 100}
          ratio={element.properties?.ratio ?? 0.5}
          selected={props.selectedElementId === element.id}
        />
      )}
      {props.showBody !== false && element.type === "microbit" && (
        <Microbit
          id={element.id}
          x={1}
          y={22}
          onControllerInput={(input: any) => {
            props.onControllerInput(element.id, input);
          }}
          leds={
            (element.controller?.leds as number[][] | undefined) ??
            Array.from({ length: 5 }, () => Array(5).fill(0))
          }
          selected={props.selectedElementId === element.id}
          isSimulationOn={props.isSimulationOn}
          pins={
            (element.controller?.pins as Record<
              string,
              { digital?: number }
            >) ?? {}
          }
        />
      )}
      {props.showBody !== false && element.type === "microbitWithBreakout" && (
        <MicrobitWithBreakout
          id={element.id}
          x={1}
          y={22}
          onControllerInput={(input: any) => {
            props.onControllerInput(element.id, input);
          }}
          leds={
            (element.controller?.leds as number[][] | undefined) ??
            Array.from({ length: 5 }, () => Array(5).fill(0))
          }
          selected={props.selectedElementId === element.id}
          isSimulationOn={props.isSimulationOn}
          pins={
            (element.controller?.pins as Record<
              string,
              { digital?: number }
            >) ?? {}
          }
        />
      )}
      {props.showBody !== false && element.type === "ultrasonicsensor4p" && (
        <UltraSonicSensor4P
          id={element.id}
          x={0}
          y={0}
          selected={props.selectedElementId === element.id}
          connectionPins={{
            trig: element.nodes.find((n) => n.placeholder === "TRIG")?.id,
            echo: element.nodes.find((n) => n.placeholder === "ECHO")?.id,
            vcc: element.nodes.find((n) => n.placeholder === "VCC(+5V)")?.id,
            gnd: element.nodes.find((n) => n.placeholder === "GND")?.id,
          }}
          // Pass the complete connected microbit data with pin information
          connectedMicrobit={
            connectedMicrobitData
              ? {
                  microbitId: connectedMicrobitData.microbit.id,
                  pins:
                    (connectedMicrobitData.microbit.controller?.pins as Record<
                      string,
                      { digital?: number }
                    >) ?? {},
                  connections: {
                    vcc: connectedMicrobitData.connections.vcc,
                    gnd: connectedMicrobitData.connections.gnd,
                    trig: connectedMicrobitData.connections.trig,
                    echo: connectedMicrobitData.connections.echo,
                    allConnected:
                      connectedMicrobitData.connections.allConnected,
                    trigPin: connectedMicrobitData.connections.trigPin,
                    echoPin: connectedMicrobitData.connections.echoPin,
                  },
                }
              : undefined
          }
          isSimulation={props.isSimulationOn}
        />
      )}

      {/* Render nodes and tooltip (can be disabled) */}
      {props.showNodes !== false &&
        element.nodes.map((node) => {
          const isHovered = node.id === hoveredNodeId;

          return (
            <Group key={node.id}>
              <Rect
                x={node.x - 2}
                y={node.y - 2}
                width={5.6}
                height={5.6}
                cornerRadius={0.3}
                fill={
                  isHovered && node.fillColor ? node.fillColor : "transparent"
                }
                stroke={isHovered ? "black" : "transparent"}
                strokeWidth={isHovered ? 1.4 : 0}
                onClick={(e) => {
                  e.cancelBubble = true;
                  // Prevent starting wire creation while simulation is running
                  if (props.isSimulationOn) return;
                  props.handleNodeClick(node.id);
                }}
                hitStrokeWidth={10}
                onMouseEnter={(e) => {
                  setHoveredNodeId(node.id);
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = "pointer";
                }}
                onMouseLeave={(e) => {
                  setHoveredNodeId(null);
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = "default";
                }}
              />

              {/* Tooltip (conditionally rendered) */}
              {isHovered && node.placeholder && (
                <Label x={node.x + 8} y={node.y - 18} opacity={0.95}>
                  <Tag
                    fill="#1f4060"
                    stroke="black"
                    strokeWidth={0.6}
                    cornerRadius={4}
                    shadowColor="black"
                    shadowBlur={1}
                    shadowOffset={{ x: 2, y: 2 }}
                    shadowOpacity={0}
                    opacity={0.5}
                  />
                  <Text
                    text={node.placeholder}
                    fontSize={10}
                    padding={5}
                    fill="white"
                  />
                </Label>
              )}
            </Group>
          );
        })}
    </Group>
  );
}