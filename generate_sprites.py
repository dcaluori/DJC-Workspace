"""
Generate cute pasta and player sprites for Pasta Invaders using the OpenAI Images API.

Usage:
  1. Install dependencies (in a venv if you like):
       pip install requests
  2. Set your API key in the environment:
       export OPENAI_API_KEY="sk-..."
  3. From the `pasta-invaders` folder, run:
       python generate_sprites.py
  4. It will create a `sprites/` folder with PNG files the game can load.
"""

import base64
import os
from pathlib import Path

import requests


API_KEY = os.environ.get("OPENAI_API_KEY")
if not API_KEY:
  raise SystemExit("Please set OPENAI_API_KEY in your environment before running this script.")


MODEL = "gpt-image-1"
# Use a supported size; we'll downscale in the game if needed.
SIZE = "1024x1024"

SPRITE_SPECS = {
  "bowl": "Adorable super cute kawaii chibi bowl of spaghetti and meatballs with a tiny spoon, huge sparkly eyes, blushing cheeks, precious smile, ultra detailed soft rendering, premium quality illustration, warm lighting, clean dark outline, transparent background, character design sheet quality, Pixar-level cuteness",
  "meatball": "Adorable super cute kawaii saucy meatball with tiny face, huge sparkly eyes, blushing cheeks, glossy red tomato sauce trail, precious expression, ultra detailed soft rendering, premium quality illustration, clean dark outline, transparent background, character design sheet quality",
  "PENNE": "Adorable super cute kawaii penne pasta character, huge sparkly eyes, tiny blushing cheeks, precious smile, slightly tilted tube with soft ridges, warm golden color, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
  "FARFALLE": "Adorable super cute kawaii farfalle bow-tie pasta character, huge sparkly eyes, tiny blushing cheeks, precious smile, soft butterfly shape, warm golden color, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
  "FUSILLI": "Adorable super cute kawaii fusilli spiral pasta character, huge sparkly eyes, tiny blushing cheeks, precious smile, curly spiral body, warm golden-orange color, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
  "RIGATONI": "Adorable super cute kawaii rigatoni tube pasta character, huge sparkly eyes, tiny blushing cheeks, precious smile, chunky ridged tube, warm toasted orange color, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
  "SPAGHETTI_NEST": "Adorable super cute kawaii nest of spaghetti with a tiny face in the center, huge sparkly eyes, tiny blushing cheeks, precious smile, tangled golden strands, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
  "TORTELLINI": "Adorable super cute kawaii tortellini ring pasta character, huge sparkly eyes, tiny blushing cheeks, precious smile, soft dough ring shape, warm pale yellow color, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
  "ORECCHIETTE": "Adorable super cute kawaii orecchiette little-ear pasta character, huge sparkly eyes, tiny blushing cheeks, precious smile, small cup shape, warm yellow color, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
  "GNOCCHI": "Adorable super cute kawaii gnocchi dumpling character, huge sparkly eyes, tiny blushing cheeks, precious smile, pillowy soft shape, warm light yellow color, ultra detailed soft rendering, premium quality illustration, Pixar-level cuteness, clean dark outline, transparent background",
}


def generate_sprite(name: str, prompt: str, out_dir: Path) -> None:
  print(f"Generating sprite for {name}...")
  url = "https://api.openai.com/v1/images/generations"
  resp = requests.post(
    url,
    headers={
      "Authorization": f"Bearer {API_KEY}",
      "Content-Type": "application/json",
    },
    json={
      "model": MODEL,
      "prompt": prompt,
      "n": 1,
      "size": SIZE,
    },
    timeout=60,
  )

  if resp.status_code != 200:
    print(f"[ERROR] Status {resp.status_code} for {name}: {resp.text}")
    return

  try:
    b64_data = resp.json()["data"][0]["b64_json"]
  except Exception as parse_err:
    print(f"[ERROR] Could not parse response for {name}: {parse_err} | raw: {resp.text[:300]}")
    return

  # Decode base64 image bytes
  image_bytes = base64.b64decode(b64_data)
  out_path = out_dir / f"{name}.png"
  out_path.write_bytes(image_bytes)
  print(f"Saved {out_path}")


def main() -> None:
  root = Path(__file__).parent
  sprites_dir = root / "sprites"
  sprites_dir.mkdir(exist_ok=True)

  for name, prompt in SPRITE_SPECS.items():
    try:
      generate_sprite(name, prompt, sprites_dir)
    except Exception as e:
      print(f"Failed to generate {name}: {e}")


if __name__ == "__main__":
  main()

