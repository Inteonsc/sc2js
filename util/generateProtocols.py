# One time vibe coded script to convert the current s2protocols to json for use in sc2js

import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'vendor', 's2protocol'))

output_dir = os.path.join(os.path.dirname(__file__), '..', 'protocols')
os.makedirs(output_dir, exist_ok=True)

s2protocol_dir = os.path.join(os.path.dirname(__file__), '..', 'vendor', 's2protocol','s2protocol', 'versions')

builds = sorted([
    int(match.group(1))
    for filename in os.listdir(s2protocol_dir)
    if (match := re.match(r'^protocol(\d+)\.py$', filename))
])

print(f"Found {len(builds)} protocol files")

success = 0
failed = 0

for build in builds:
    try:
        filepath = os.path.join(s2protocol_dir, f'protocol{build}.py')
        namespace = {}
        with open(filepath, 'r', encoding='utf-8') as f:
            exec(compile(f.read(), filepath, 'exec'), namespace)
        data = {
            'typeinfos': namespace['typeinfos'],
            'game_event_types': namespace['game_event_types'],
            'tracker_event_types': namespace['tracker_event_types'],
            'message_event_types': namespace['message_event_types'],
            'game_eventid_typeid': namespace['game_eventid_typeid'],
            'tracker_eventid_typeid': namespace['tracker_eventid_typeid'],
            'message_eventid_typeid': namespace['message_eventid_typeid'],
            'svaruint32_typeid': namespace['svaruint32_typeid'],
            'replay_userid_typeid': namespace['replay_userid_typeid'],
            'replay_header_typeid': namespace['replay_header_typeid'],
            'game_details_typeid': namespace['game_details_typeid'],
            'replay_initdata_typeid': namespace['replay_initdata_typeid'],
        }
        output_path = os.path.join(output_dir, f'protocol{build}.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f'  ✓ protocol{build}')
        success += 1
    except Exception as e:
        print(f'  ✗ protocol{build}: {e}')
        failed += 1

print(f"\nDone: {success} succeeded, {failed} failed")