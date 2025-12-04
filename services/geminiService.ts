
import { GoogleGenAI } from "@google/genai";
import { GameMap } from "../types";
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, DEFAULT_MAP } from "../constants";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateGameMap = async (theme: string): Promise<GameMap> => {
  if (!apiKey) return DEFAULT_MAP;

  try {
    const prompt = `
      Create a 2D platformer arena map in JSON format.
      Dimensions: ${MAP_WIDTH}x${MAP_HEIGHT}.
      Theme: ${theme}.
      
      Legend:
      0 = Empty Air
      1 = Solid Wall/Ground
      2 = Jump-through Platform
      3 = Deadly Spike (Floor hazard)
      
      CRITICAL LAYOUT RULES:
      - The map MUST be an OPEN ARENA. 
      - DO NOT create enclosed rooms, boxes, or isolated pockets where players can get stuck.
      - Ensure high connectivity. Players must be able to jump to all areas.
      - The outer borders (left, right, bottom) must be solid (1).
      - USE PLATFORMS (2) SPARINGLY. Do not clutter the air. Leave space for jumping.
      - Create interesting verticality with solid blocks (1).
      - Place Spikes (3) sparingly, only on top of solid blocks.
      - Provide exactly 2 safe spawn coordinates (x,y) that are on solid ground and NOT inside walls.
      
      Output ONLY valid JSON. No markdown code blocks.
      Format:
      {
        "tiles": [[1,1,1...], ...],
        "spawns": [{"x":2, "y":2}, {"x":20, "y":2}]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 1.0,
      }
    });

    const text = response.text || "";
    
    // cleanup json string if it contains markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    
    let json;
    try {
        json = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", text);
        return { ...DEFAULT_MAP, theme };
    }

    // Validate dimensions
    const tiles: number[][] = json.tiles;
    if (!tiles || tiles.length !== MAP_HEIGHT || tiles[0].length !== MAP_WIDTH) {
      console.warn("Generated map dimensions incorrect, falling back to default");
      return DEFAULT_MAP;
    }

    return {
      tiles: tiles,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      tileSize: TILE_SIZE,
      spawns: json.spawns || [{x: 2, y: 2}, {x: MAP_WIDTH-3, y: 2}],
      theme: theme
    };

  } catch (error) {
    console.error("Gemini map generation failed:", error);
    // Return default map on failure so game can still start
    return { ...DEFAULT_MAP, theme: theme };
  }
};

export const getBotCommentary = async (event: string, winner: string, loser: string): Promise<string> => {
  if (!apiKey) return "GG!";

  try {
    const prompt = `
      Write a funny, short 1-sentence trash talk from a game bot.
      Context: The bot (${winner}) just defeated ${loser}.
      Theme: ${event}.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 1.2,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for short responses
      }
    });

    return response.text?.trim() || "Target eliminated.";
  } catch (e) {
    return "Calculated elimination.";
  }
};
