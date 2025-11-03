import json

# Read restaurant config
with open('/workspace/user_input_files/restaurant-config.json', 'r') as f:
    config = json.load(f)

# Write minified version
with open('/workspace/restaurant-config-minified.json', 'w') as f:
    json.dump(config, f, separators=(',', ':'))

print(f"Minified config created with {len(json.dumps(config))} characters")
