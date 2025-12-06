
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Zap } from 'lucide-react';

// Firebase Imports (using standard module imports, assumed available in the environment)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// --- Global Setup (Simulating environment variables) ---
// MANDATORY: Global Variables already provided for Firestore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Mandatory: Set log level for debugging
setLogLevel('Debug');

// --- LLM API Configuration ---
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = ""; // Provided by Canvas environment
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
const SYSTEM_PROMPT = `You are the friendly, helpful AI Customer Service Agent for LettucEat, a food ordering and tracking app. Your goal is to provide immediate, actionable troubleshooting steps based on the user's reported order issue.
1. Acknowledge the user's frustration calmly.
2. Provide 1-3 clear, numbered steps for resolution.
3. Refer to the app's features (like 'live tracking' or 'in-app chat').
4. Keep the response brief, professional, and supportive.
5. Use markdown for lists and emphasis.`;


// Helper for API calls with exponential backoff
const fetchWithExponentialBackoff = async (url, options, maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status !== 429) {
                return response;
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('API call failed after multiple retries.');
};



const Accordion = ({ title, content }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const answerRef = React.useRef(null);

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <div
                className="flex justify-between items-center p-3 cursor-pointer faq-question transition duration-300 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="font-semibold text-gray-800">{title}</span>
                <ChevronDown
                    className={`w-5 h-5 text-[#8cc63f] transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                />
            </div>
            <div
                ref={answerRef}
                className="faq-answer overflow-hidden transition-all duration-400 ease-out"
                style={{
                    maxHeight: isExpanded ? `${answerRef.current?.scrollHeight}px` : '0',
                }}
            >
                <div className="p-3 pt-0 text-gray-600">
                    {content}
                </div>
            </div>
        </div>
    );
};