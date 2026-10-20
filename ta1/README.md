# Recipe Scaler & Nutrition Estimator

## Project Overview
This project demonstrates an autonomous AI Agent capable of chaining multiple tools. The agent receives a natural language request to scale a recipe and calculate its estimated calories, and it autonomously decides which tools to call and in what order to achieve the goal.

## Architecture

```text
User
 ↓
AI Agent
 ↓
Decision Making
 ↓
scale_recipe Tool
 ↓
Scaled Amount
 ↓
estimate_calories Tool
 ↓
Final Response
```

## Tools

### Tool 1: `scale_recipe()`
**Purpose:** Scale ingredient quantities according to servings.

### Tool 2: `estimate_calories()`
**Purpose:** Estimate total calories based on the scaled ingredient amount and calories per unit.

## Why Two Tools?
This project uses two simple tools instead of one large tool because each tool has a single responsibility. 
`scale_recipe` is responsible only for ingredient scaling.
`estimate_calories` is responsible only for calorie calculation.

This design provides:
- Better modularity
- Easier testing
- Better debugging
- Reusability
- Clear agent reasoning
- Easier extension

The AI agent demonstrates autonomous planning by deciding when to use one tool or both tools.

## Installation

1. Install Ollama from [https://ollama.com](https://ollama.com).
2. Pull the model:
   ```bash
   ollama pull qwen2.5:3b
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the application:
   ```bash
   python main.py
   ```

## Jury Questions

### What happens if servings_original is 0?
If `servings_original` is 0, scaling would normally cause a division-by-zero error.
To prevent this, the `scale_recipe` tool validates the input before performing the calculation.
If `servings_original <= 0`, the tool returns:
`Error: Original servings must be greater than zero.`
Therefore, the system does not crash.

### Is this better solved by one smarter tool or two simple tools?
Two simple tools are preferred.
The Single Responsibility Principle is followed.
The scaling tool performs scaling only.
The calorie tool performs calorie estimation only.
The AI Agent coordinates the tools.
This makes the system more modular and easier to test.
It also demonstrates true agent behavior because the agent must decide which tool to call and in what order.
A single large tool would hide the decision-making process and reduce tool reusability.

# Streamlit Web Interface

Installation:

```bash
pip install -r requirements.txt
```

Run:

```bash
streamlit run streamlit_app.py
```

The Streamlit frontend is an interactive visual interface for the existing autonomous AI agent. It allows users to easily input recipes and visualize the agent's step-by-step tool selection and execution.

```text
Streamlit UI
     ↓
LangGraph ReAct Agent
     ↓
Autonomous Tool Selection
     ↓
scale_recipe
     ↓
estimate_calories
     ↓
Final Result
```
