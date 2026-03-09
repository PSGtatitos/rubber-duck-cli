#!/usr/bin/env python3
# atlas_cli.py - Text CLI interface for ATLAS

import json
import sys
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# ────────────────────────────────────────────────
# CONFIG
# ────────────────────────────────────────────────

API_URL = "http://localhost:3000"

MIN_INPUT_LENGTH = 2

NOISE_WORDS = {'', 'huh', 'uh', 'um', 'hmm', 'ah', 'oh', 'eh', 'a', 'the', 'i', 'it'}

STOP_PHRASES = [
    "ok that is all for today",
    "that's all for today",
    "ok that's all",
    "goodbye atlas",
    "goodbye",
    "exit",
    "quit"
]

# Conversation history (persists across interactions)
conversation_history = []

# ────────────────────────────────────────────────
# SYSTEM COMMAND HANDLER
# ────────────────────────────────────────────────

def handle_system_command(text):
    """Handle computer control commands."""
    text_lower = text.lower()

    # Open any website
    if "open website" in text_lower or "go to" in text_lower:
        site = text_lower.split("open website", 1)[1].strip() if "open website" in text_lower \
               else text_lower.split("go to", 1)[1].strip()
        if "." not in site:
            site = f"{site}.com"
        if not site.startswith("http"):
            site = f"https://{site}"
        try:
            requests.post(f"{API_URL}/api/system-commands",
                          json={"action": "open-url", "parameter": site}, timeout=5)
            return f"Opening {site}"
        except Exception:
            return f"Failed to open {site}"

    # Common site shortcuts
    common_sites = {
        "youtube":   "https://youtube.com",
        "google":    "https://google.com",
        "netflix":   "https://netflix.com",
        "facebook":  "https://facebook.com",
        "twitter":   "https://twitter.com",
        "reddit":    "https://reddit.com",
        "instagram": "https://instagram.com",
        "gmail":     "https://gmail.com",
        "amazon":    "https://amazon.com",
        "github":    "https://github.com",
    }
    for site_name, url in common_sites.items():
        if f"open {site_name}" in text_lower:
            try:
                requests.post(f"{API_URL}/api/system-commands",
                              json={"action": "open-url", "parameter": url}, timeout=5)
                return f"Opening {site_name}"
            except Exception:
                return f"Failed to open {site_name}"

    # Google search
    if "search for" in text_lower or "google search" in text_lower or "search" in text_lower:
        if "search for" in text_lower:
            query = text_lower.split("search for", 1)[1].strip()
        elif "google search" in text_lower:
            query = text_lower.split("google search", 1)[1].strip()
        else:
            query = text_lower.split("search", 1)[1].strip()
        if query:
            try:
                requests.post(f"{API_URL}/api/system-commands",
                              json={"action": "search-google", "parameter": query}, timeout=5)
                return f"Searching for {query}"
            except Exception:
                return "Failed to search"

    # Open any application
    if "open " in text_lower or "launch " in text_lower:
        app = text_lower.split("open ", 1)[1].strip() if "open " in text_lower \
              else text_lower.split("launch ", 1)[1].strip()
        app = app.replace("app", "").replace("application", "").strip()
        if app in ["youtube", "google", "netflix", "facebook"]:
            return None
        try:
            requests.post(f"{API_URL}/api/system-commands",
                          json={"action": "open-app", "parameter": app}, timeout=5)
            return f"Opening {app}"
        except Exception:
            return f"Failed to open {app}"

    return None

# ────────────────────────────────────────────────
# MAIN LOOP
# ────────────────────────────────────────────────

def main():
    global conversation_history

    print("─" * 50)
    print("  ATLAS CLI — type your message, or 'exit' to quit")
    print("─" * 50 + "\n")

    try:
        while True:
            try:
                user_input = input("You: ").strip()
            except EOFError:
                print("\nGoodbye!")
                break

            if not user_input:
                continue

            # Check stop/exit phrases
            if any(phrase.lower() in user_input.lower() for phrase in STOP_PHRASES):
                print("ATLAS: Goodbye!")
                break

            # Skip noise/very short input
            if len(user_input) < MIN_INPUT_LENGTH or user_input.lower() in NOISE_WORDS:
                print("[Skipped] Input too short or invalid.\n")
                continue

            # System command check
            system_response = handle_system_command(user_input)
            if system_response:
                print(f"System: {system_response}\n")
                continue

            # Send to /api/ask
            try:
                send_history = list(conversation_history)
                if not any(
                    isinstance(m, dict) and m.get("role") == "system"
                    and "english" in m.get("content", "").lower()
                    for m in send_history
                ):
                    send_history.insert(0, {
                        "role": "system",
                        "content": "You are ATLAS assistant. Please respond ONLY in English."
                    })

                payload = {
                    "text": user_input,
                    "context": {
                        "temperature": 23.5,
                        "humidity": 65,
                        "location": "New Philadelphia, Greece",
                        "forceResponseLanguage": "en"
                    },
                    "conversationHistory": send_history,
                    "responseLanguage": "en",
                    "systemPrompt": "Please respond only in English."
                }

                r = requests.post(f"{API_URL}/api/ask", json=payload, timeout=40)
                r.raise_for_status()
                resp_data = r.json()

                answer = resp_data.get("response", "No response.")
                conversation_history = resp_data.get("conversationHistory", [])

                print(f"ATLAS: {answer}")
                print(f"[History: {len(conversation_history)} messages]\n")

            except requests.exceptions.ConnectionError:
                print("Error: Could not connect to the ATLAS server. Is it running?\n")
            except requests.exceptions.Timeout:
                print("Error: Request timed out.\n")
            except requests.exceptions.RequestException as e:
                print(f"Error: {e}\n")
            except Exception as e:
                print(f"Unexpected error: {e}\n")

    except KeyboardInterrupt:
        print("\n\nGoodbye!")


if __name__ == "__main__":
    main()