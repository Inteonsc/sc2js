import { VersionedDecoder, BitPackedBuffer, BitPackedDecoder } from "./decoder.js";

function varuInt32Value(value) {
	return Object.values(value)[0] ?? 0;
}

function* decodeEventStream(decoder, eventid_typeid, event_types, decode_user_id, protocol) {
	// Decodes events prefixed with a gameloop and possibly userid
	let gameloop = 0;
	while (!decoder.finished()) {
		const start_bits = decoder.usedBits();
		try {
			// decode the gameloop delta before each event
			const delta = varuInt32Value(decoder.instance(protocol.svaruint32_typeid));
			gameloop += delta;

			// decode the userid before each event
			let userid = null;
			if (decode_user_id) {
				userid = decoder.instance(protocol.replay_userid_typeid);
			}

			//decode the event id
			const eventid = decoder.instance(eventid_typeid);
			const eventType = event_types[eventid] ?? [null, null];
			const [typeid, typename] = eventType;
			if (typeid === null) {
				throw new Error(`EventID ${eventid} at ${decoder} corrupted`);
			}

			// decode the event struct instance
			const event = decoder.instance(typeid);
			event._event = typename;
			event._eventid = eventid;
			// insert gameloop and userid
			event._gameloop = gameloop;
			if (decode_user_id) {
				event._userid = userid;
			}
			// the next eventis byte aligned
			decoder.byteAlign();
			// insert bits used in stream
			event._bits = decoder.usedBits() - start_bits;

			yield event;
		} catch (e) {
			yield { _event: "_error", _gameloop: gameloop, _error: e.message };
			return; // can't safely continue — bit position is unknown after a decode failure
		}
	}
}

export function* decodeReplayGameEvents(contents, protocol) {
	const decoder = new BitPackedDecoder(contents, protocol.typeinfos);
	for (const event of decodeEventStream(
		decoder,
		protocol.game_eventid_typeid,
		protocol.game_event_types,
		true,
		protocol
	)) {
		yield event;
	}
}

export function* decodeReplayMessageEvents(contents, protocol) {
	const decoder = new BitPackedDecoder(contents, protocol.typeinfos);
	for (const event of decodeEventStream(
		decoder,
		protocol.message_eventid_typeid,
		protocol.message_event_types,
		true,
		protocol
	)) {
		yield event;
	}
}

export function* decodeReplayTrackerEvents(contents, protocol) {
	const decoder = new VersionedDecoder(contents, protocol.typeinfos);
	for (const event of decodeEventStream(
		decoder,
		protocol.tracker_eventid_typeid,
		protocol.tracker_event_types,
		false,
		protocol
	)) {
		yield event;
	}
}

export function decodeReplayHeader(contents, protocol) {
	const decoder = new VersionedDecoder(contents, protocol.typeinfos);
	return decoder.instance(protocol.replay_header_typeid);
}

export function decodeReplayDetails(contents, protocol) {
	const decoder = new VersionedDecoder(contents, protocol.typeinfos);
	return decoder.instance(protocol.game_details_typeid);
}

export function decodeReplayInitData(contents, protocol) {
	const decoder = new BitPackedDecoder(contents, protocol.typeinfos);
	return decoder.instance(protocol.replay_initdata_typeid);
}

export function decodeReplayAttributesEvents(contents) {
	const buffer = new BitPackedBuffer(contents, "little");
	let attributes = {};
	if (!buffer.finished()) {
		attributes.source = buffer.readBits(8);
		attributes.mapNamespace = buffer.readBits(32);
		const count = buffer.readBits(32);
		attributes.scopes = {};
		while (!buffer.finished()) {
			let value = {};
			value.namespace = buffer.readBits(32);
			const attrid = buffer.readBits(32);
			value.attrid = attrid;
			const scope = buffer.readBits(8);
			const raw = buffer.readAlignedBytes(4);
			value.value = raw
				.reverse()
				.filter((b) => b !== 0)
				.toString("utf-8");
			if (!(scope in attributes.scopes)) {
				attributes.scopes[scope] = {};
			}
			if (!(attrid in attributes.scopes[scope])) {
				attributes.scopes[scope][attrid] = [];
			}
			attributes.scopes[scope][attrid].push(value);
		}
	}
	return attributes;
}

export function unitTag(unitTagIndex, unitTagRecycle) {
	return (unitTagIndex << 18) + unitTagRecycle;
}
export function unitTagIndex(unitTag) {
	return (unitTag >> 18) & 0x00003fff;
}
export function unitTagRecycle(unitTag) {
	return unitTag & 0x0003ffff;
}
