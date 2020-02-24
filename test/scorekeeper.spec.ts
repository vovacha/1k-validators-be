import test from 'ava';
import Database from '../src/db';
import Scorekeeper from '../src/scorekeeper';

import * as fs from 'fs';

import {
	MockApi,
	MockConfig,
	MockDb,
} from './mock';

test.before(async (t: any) => {
	const db = new Database('test.db');

	await db.reportOnline(0, ['nodeZero']);
	await db.addCandidate('nodeZero', 'stash0');

	await db.reportOnline(1, ['nodeOne']);
	await db.addCandidate('nodeOne', 'stash1');

	//@ts-ignore
	t.context.sk = new Scorekeeper(MockApi, db, MockConfig);
	t.context.db = db;
});

test.after((t: any) => {
	if (fs.existsSync('test.db')) {
		fs.unlinkSync('test.db');
	}
});

test('Creates a new Scorekeeper', (t: any) => {
	//@ts-ignore
	const sk = new Scorekeeper(MockApi, MockDb, MockConfig);
	t.is(MockApi, sk.api);
	t.is(MockDb, sk.db);
	t.is(MockConfig, sk.config);
});

test('_getSet() returns the expected nodes', async (t: any) => {
	//@ts-ignore
	const sk = new Scorekeeper(MockApi, MockDb, MockConfig);
	const set = await sk._getSet();
	t.is(set.length, 2);
	t.is(set[0].name, MockDb.allNodes()[1].name);
	t.is(set[1].name, MockDb.allNodes()[0].name);
	t.is(set.length, 2);
});

test('addPoint() and dockPoints() works', async (t: any) => {
	//@ts-ignore
	const { db, sk } = t.context;

	const four = 4;
	for (let i = 0; i < four; i++) {
		await sk.addPoint('stash0');
	}
	const data = await db.getValidator('stash0');
	t.is(data.rank, 4);
	t.is(data.misbehaviors, 0);

	const before = new Date().getTime();
	await sk.dockPoints('stash0');

	const dataAgain = await db.getValidator('stash0');
	t.is(dataAgain.rank, 2);
	t.is(dataAgain.misbehaviors, 1);
	t.true(before <= dataAgain.goodSince);
});
