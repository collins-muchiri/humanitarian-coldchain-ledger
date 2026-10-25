PATTERN: catch{} || .catch(()=>{}) || process.exit(0) || try/catch swallow
./docs/qa/artifacts/sweep_raw.md:1:PATTERN: catch{} || .catch(()=>{}) || process.exit(0) || try/catch swallow
./docs/qa/artifacts/sweep_raw.md:1:PATTERN: catch{} || .catch(()=>{}) || process.exit(0) || try/catch swallow
./docs/qa/artifacts/sweep_raw.md:2:./docs/qa/artifacts/sweep_raw.md:1:PATTERN: catch{} || .catch(()=>{}) || process.exit(0) || try/catch swallow
./tests/shares.test.js:50:  assert.ok(stats.profit !== 0 || true); // value depends on CPMM path; finiteness + definition tested below
PATTERN: console.error without exit code (pre-fix census)
./identity/crypto-util.js:67:    console.error('Error verifying signature:', error.message);
./docs/qa/artifacts/sweep_raw.md:6:PATTERN: console.error without exit code (pre-fix census)
./bin/audit-ledger.js:17:  console.error('CHAIN INTEGRITY COMPROMISED:');
./bin/audit-ledger.js:19:    console.error(` - ${err}`);
./public/index.html:284:                        console.error("❌ Failed to sync ledger:", err);
./public/markets.html:278:                        console.error('Failed to fetch markets:', err);
./public/markets.html:288:                        console.error('Failed to fetch leaderboard:', err);
PATTERN: silent defaults / swallowed errors in server
108:  } catch (error) {
157:  } catch (error) {
200:  } catch (error) {
271:  } catch (error) {
292:  } catch (error) {
314:  } catch (error) {
356:  } catch (error) {
396:  } catch (error) {
433:  } catch (error) {
449:  } catch (error) {
465:  } catch (error) {
509:  } catch (error) {
PATTERN: seeds/randomness
./scripts/demo-api.js:30:    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
./scripts/demo-api.js:31:    const randomNum = Math.floor(100 + Math.random() * 900); // Random 3-digit number
./scripts/demo-api.js:56:            type: types[Math.floor(Math.random() * types.length)], // Random type
./scripts/demo-api.js:57:            origin: origins[Math.floor(Math.random() * origins.length)], // Random origin
./scripts/demo-api.js:58:            temperature: Math.floor(2 + Math.random() * 7), // Random temp between 2-8
./scripts/demo-api.js:59:            location: locations[Math.floor(Math.random() * locations.length)] // Random location
