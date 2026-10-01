# Changelog

## [1.24.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.24.0...v1.24.1) (2026-09-29)


### Bug Fixes

* **availability:** stop cancelled bookings from pinning off-grid slots ([#97](https://github.com/frostiks777/ai-for-developers-project-386/issues/97)) ([3733379](https://github.com/frostiks777/ai-for-developers-project-386/commit/3733379c69d476daad2445d0b19963a847edbad9))

## [1.24.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.23.2...v1.24.0) (2026-09-29)


### Features

* add back button to booking success screen ([96e42ee](https://github.com/frostiks777/ai-for-developers-project-386/commit/96e42eeef85f78ee1e9de1cfe9486addaea1f1fe))
* add call calendar app skeleton ([b42529b](https://github.com/frostiks777/ai-for-developers-project-386/commit/b42529be7e99c87296fe151a001db7465f7ed8d2))
* add ics and Google Calendar export on success screen ([b5adb8c](https://github.com/frostiks777/ai-for-developers-project-386/commit/b5adb8ca69371cb0dac80ed8c828648457d0690a))
* add month calendar with date filtering ([28d8e40](https://github.com/frostiks777/ai-for-developers-project-386/commit/28d8e40d71dcd52589cface1ce5e215752c19974))
* add optional booking comment field ([efc55af](https://github.com/frostiks777/ai-for-developers-project-386/commit/efc55afae0e9ed1458d4e1ad2c83f07b4afa3767))
* add organizer dashboard with cancellation and availability ([c5d9e8f](https://github.com/frostiks777/ai-for-developers-project-386/commit/c5d9e8f0abc6a39b897781d515add52c12bfe6b2))
* add slot booking dialog with toasts ([c24185d](https://github.com/frostiks777/ai-for-developers-project-386/commit/c24185d25216f8b079fe9611651b0c3c3a86eb39))
* add time zone selector and zone-aware formatting ([2a92992](https://github.com/frostiks777/ai-for-developers-project-386/commit/2a9299244f84dd9509d4a85a23af015de8009207))
* allow cancelling a booking by token link ([42aced3](https://github.com/frostiks777/ai-for-developers-project-386/commit/42aced3041d719cfeca5edd406fcc08ff7172756))
* allow rescheduling a booking by token link ([48b811c](https://github.com/frostiks777/ai-for-developers-project-386/commit/48b811c84936cc615e4c987afb9f895a311f039b))
* **api:** add availability ranges settings and form ([#22](https://github.com/frostiks777/ai-for-developers-project-386/issues/22)) ([3f1378e](https://github.com/frostiks777/ai-for-developers-project-386/commit/3f1378ec1e9f71619b2e482e81e871562bb72ea9))
* **api:** add event types CRUD and owner editor ([#21](https://github.com/frostiks777/ai-for-developers-project-386/issues/21)) ([77118f8](https://github.com/frostiks777/ai-for-developers-project-386/commit/77118f8c20312936d6b782a4ee03a4afd5312e19))
* **api:** add GET /api/bookings with slot details ([9fc9fcf](https://github.com/frostiks777/ai-for-developers-project-386/commit/9fc9fcfdb85a469fe81cf6b81641646faf5c0fad))
* **api:** add guests, consent and idempotency key to booking contract ([3ce6af2](https://github.com/frostiks777/ai-for-developers-project-386/commit/3ce6af2a06a8d4897698427212eefe012c051166))
* **api:** add hosts CRUD to contract and make list public ([#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42)) ([c586988](https://github.com/frostiks777/ai-for-developers-project-386/commit/c586988962d1da15515a94ddc9eca2b99a08d027))
* **api:** add TypeSpec contract for /api/v1 ([b2810e3](https://github.com/frostiks777/ai-for-developers-project-386/commit/b2810e3ed3c1624a02379d7053d0629b9c9edc75))
* **api:** create bookings via v1 with type and conflict handling ([#24](https://github.com/frostiks777/ai-for-developers-project-386/issues/24)) ([13305e6](https://github.com/frostiks777/ai-for-developers-project-386/commit/13305e6f0396793e19e3d4f4ef579817041d862c))
* **api:** filter slots by event type and add guest type picker ([#23](https://github.com/frostiks777/ai-for-developers-project-386/issues/23)) ([49dda47](https://github.com/frostiks777/ai-for-developers-project-386/commit/49dda4799a7f08996dde9f7c8faa5ba6c0b0ab72))
* **api:** generate OpenAPI and client SDK from TypeSpec via api:generate ([e5c6ad7](https://github.com/frostiks777/ai-for-developers-project-386/commit/e5c6ad775a9c4a4d120a1ff17443a32ec2f4224c))
* **api:** generate server API types from OpenAPI ([a2e65d2](https://github.com/frostiks777/ai-for-developers-project-386/commit/a2e65d2e32b7a9bf1f5bb6f31948bff1d538d5e2))
* **api:** generate slots in host time zone ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([76e5b12](https://github.com/frostiks777/ai-for-developers-project-386/commit/76e5b12bc06af3ca059df7d9427d728ba612f10b))
* **api:** migrate frontend to generated SDK ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25)) ([6a9f7da](https://github.com/frostiks777/ai-for-developers-project-386/commit/6a9f7dae3149a509b0c34e7c176c2803784f7df4))
* **api:** split slot buffer into before and after ([5dc6241](https://github.com/frostiks777/ai-for-developers-project-386/commit/5dc6241cbefa6da495a4112491283dc0c7501a82))
* **auth:** open organizer dashboard without login ([#88](https://github.com/frostiks777/ai-for-developers-project-386/issues/88)) ([be47ce4](https://github.com/frostiks777/ai-for-developers-project-386/commit/be47ce4a6d9ada50b0603ed031ee3147df0b85d9))
* **availability:** redesign settings form with switch, presets and validation ([762469e](https://github.com/frostiks777/ai-for-developers-project-386/commit/762469e167b0a8957a9467352b551670d4417a5d))
* **availability:** use separate before and after buffers ([3c4a5c2](https://github.com/frostiks777/ai-for-developers-project-386/commit/3c4a5c2827eb68b72cdd7ce8f0a9d597d20f1030))
* **booking:** add cancellation reason and confirmation modal ([8322ba9](https://github.com/frostiks777/ai-for-developers-project-386/commit/8322ba9e03ae11dce76c56965df30ebbfe72c4eb))
* **booking:** add landing page and move booking to /book/:slug ([d0d6319](https://github.com/frostiks777/ai-for-developers-project-386/commit/d0d63192618a460262124362f717164e114636f0))
* **booking:** add on-device my-bookings page ([a7d32ed](https://github.com/frostiks777/ai-for-developers-project-386/commit/a7d32edfc85c179ed8ea17325a928e4c231be400))
* **booking:** add phone mask, stricter name, 409 alert and direct cancel ([2917f0e](https://github.com/frostiks777/ai-for-developers-project-386/commit/2917f0e47b545fafab568b9b899e869ffdb2044c))
* **booking:** add timezone search and 12/24 hour format toggle ([1fac388](https://github.com/frostiks777/ai-for-developers-project-386/commit/1fac3887c2c53c469795468ede07ec7008c927ab))
* **booking:** add uuid self-service routes and cancel details ([427befe](https://github.com/frostiks777/ai-for-developers-project-386/commit/427befeaf867e11a5d8e9d0c624e3d62934f72a1))
* **booking:** cancel and reschedule via v1 public id ([#30](https://github.com/frostiks777/ai-for-developers-project-386/issues/30)) ([5f7637b](https://github.com/frostiks777/ai-for-developers-project-386/commit/5f7637b200e16d2a08960ad896afeed71e390427))
* **booking:** reflect selected event type in host info panel ([cb4945c](https://github.com/frostiks777/ai-for-developers-project-386/commit/cb4945cff9e76b0989ef5321d4d63b9e732bebde))
* **booking:** require consent, collect guests and dedupe by idempotency key ([ad149fa](https://github.com/frostiks777/ai-for-developers-project-386/commit/ad149fa1990590af8760933c77ce2b7aa19ae6a6))
* **dashboard:** add status tabs, search and horizon presets ([222c1b9](https://github.com/frostiks777/ai-for-developers-project-386/commit/222c1b90ede26d274e81539b1a05d4f215f444f1))
* **dashboard:** add time blocks link to sidebar ([8256c31](https://github.com/frostiks777/ai-for-developers-project-386/commit/8256c3156072f5aaa3557b421ec41a130346779e))
* **dashboard:** deep-link /admin/* routes to sections ([7c59328](https://github.com/frostiks777/ai-for-developers-project-386/commit/7c59328db81aa33b000cef4c7687572028668e2e))
* **dashboard:** make sidebar logo link to home ([aec3917](https://github.com/frostiks777/ai-for-developers-project-386/commit/aec391722939d840d159c750e6a47b881104ab23))
* **dashboard:** reflect booking status in owner list and cancel via v1 ([#31](https://github.com/frostiks777/ai-for-developers-project-386/issues/31)) ([7d4ad4b](https://github.com/frostiks777/ai-for-developers-project-386/commit/7d4ad4bb92abd8f230aefac4d1c6e1c4f0db4e78))
* **db:** add event types, booking status and availability ranges schema ([#20](https://github.com/frostiks777/ai-for-developers-project-386/issues/20)) ([bcbbf00](https://github.com/frostiks777/ai-for-developers-project-386/commit/bcbbf00709ccaf656180ef3d1fa96e70dd93a563))
* **db:** migrate from SQLite to PostgreSQL (Neon) with PGlite tests ([c6b4383](https://github.com/frostiks777/ai-for-developers-project-386/commit/c6b4383f49e7a7b2449fa8bd058220e0be0a1b43))
* **email:** booking notifications and reminders via Brevo ([#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83)) ([d39a526](https://github.com/frostiks777/ai-for-developers-project-386/commit/d39a526b6f7bd70aab590ff8e8471278470345ee))
* **events:** add upcoming events page and confirmed booking route ([f7935f0](https://github.com/frostiks777/ai-for-developers-project-386/commit/f7935f01cc63661164177bca14187dcccfeb321b))
* generate slots from availability rules ([b6411ee](https://github.com/frostiks777/ai-for-developers-project-386/commit/b6411eeb02f7845c8643d179f6ff6887b026db74))
* make booking phone optional ([75ea338](https://github.com/frostiks777/ai-for-developers-project-386/commit/75ea338db76fc152c868cd40220efa72025c515a))
* redesign v2 «Мята и солнце» (этапы 3–13) ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([859f1ae](https://github.com/frostiks777/ai-for-developers-project-386/commit/859f1aed93676fbe7b40093052edcecc55c96e4c))
* redesign v2 mint — stages 0-2 ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([#50](https://github.com/frostiks777/ai-for-developers-project-386/issues/50)) ([a7f7ccb](https://github.com/frostiks777/ai-for-developers-project-386/commit/a7f7ccb6c31d2f5bad028e835561e0c3e9a9137a))
* require email on booking and hide past slots ([38112b1](https://github.com/frostiks777/ai-for-developers-project-386/commit/38112b1fdf5e81beb411fb82e9c18008878addb6))
* **schedule:** add manual time blocks (BlockTimeModal + API) ([f60c3c8](https://github.com/frostiks777/ai-for-developers-project-386/commit/f60c3c8ec7208885b41639c4c24fdf18922db0e7))
* **security:** protect public booking with Turnstile and per-IP rate limit ([#46](https://github.com/frostiks777/ai-for-developers-project-386/issues/46)) ([9c06719](https://github.com/frostiks777/ai-for-developers-project-386/commit/9c06719102eefe4619439672fafb4a68e18b60ad))
* serve SPA from Fastify and add Render deploy config ([6a8441f](https://github.com/frostiks777/ai-for-developers-project-386/commit/6a8441f29d3f1a8039a921fdbf9197210958f73b))
* **server:** add hosts table and versioned API v1 ([caccebf](https://github.com/frostiks777/ai-for-developers-project-386/commit/caccebf7f351fc7ddf65889b2ca120e05f718f9a))
* **server:** add multi-host model for slots and bookings ([538cc46](https://github.com/frostiks777/ai-for-developers-project-386/commit/538cc46f0f29ad96c8b16d6f068762c7fff3ad20))
* **server:** gate dashboard behind ADMIN_PASSWORD basic auth ([8523f07](https://github.com/frostiks777/ai-for-developers-project-386/commit/8523f07101ba9b9a5b5528283a818d4af1c0388d))
* **server:** require auth for admin api mutations ([a604e7e](https://github.com/frostiks777/ai-for-developers-project-386/commit/a604e7e1d00f8bff82df56bee12655d4c95a9955))
* **server:** scope availability rules per host ([#41](https://github.com/frostiks777/ai-for-developers-project-386/issues/41)) ([8652820](https://github.com/frostiks777/ai-for-developers-project-386/commit/86528207dc04d1c4a6d76101610248a91f82469e))
* show success screen with booking summary ([8b64a22](https://github.com/frostiks777/ai-for-developers-project-386/commit/8b64a22ebcf7c728b25d18008a96bc81876537df))
* **test:** contract tests and e2e Playwright gate ([#26](https://github.com/frostiks777/ai-for-developers-project-386/issues/26)) ([44ff4f8](https://github.com/frostiks777/ai-for-developers-project-386/commit/44ff4f89ec4a69dc33eb03191f27bb058c9279da))
* **ui:** add design tokens, fonts and light/dark theme ([77e9315](https://github.com/frostiks777/ai-for-developers-project-386/commit/77e93157baeec01bb77e23e3ea3a7b703a32d233))
* **ui:** add mobile booking layout ([9d7f91c](https://github.com/frostiks777/ai-for-developers-project-386/commit/9d7f91c10081a2ecee38c23750867590ce826382))
* **ui:** add public nav tabs to app header ([8201e26](https://github.com/frostiks777/ai-for-developers-project-386/commit/8201e26ca2895bc0e1cce747331318d30ab2c1c9))
* **ui:** add temporary dashboard access button to header ([04c84c8](https://github.com/frostiks777/ai-for-developers-project-386/commit/04c84c884794b4e3ad990703bf23df38f0a8be2c))
* **ui:** add v2 tokens, ambient background and glass surfaces ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([a82985a](https://github.com/frostiks777/ai-for-developers-project-386/commit/a82985a86f9d8739f849d098699e7a691364d52b))
* **ui:** add week view to desktop booking ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([b404998](https://github.com/frostiks777/ai-for-developers-project-386/commit/b4049986625acda2bc9d9a96d2dde74f2295567b))
* **ui:** keep form data and suggest nearby slots on conflict ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([8455cda](https://github.com/frostiks777/ai-for-developers-project-386/commit/8455cdaf3dd3718d14d9d53c9e9703ac87fb2ec0))
* **ui:** landing formats and my bookings in v2 style ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([02002ee](https://github.com/frostiks777/ai-for-developers-project-386/commit/02002ee6f9638f815633cafe57f26ba36c499a30))
* **ui:** mobile booking wizard ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([516b481](https://github.com/frostiks777/ai-for-developers-project-386/commit/516b4818b34fe91296060e6e84faead22d235131))
* **ui:** redesign booking page desktop layout ([f74d75a](https://github.com/frostiks777/ai-for-developers-project-386/commit/f74d75a9ad81d83f226dd1df7425cf26221b410e))
* **ui:** redesign desktop booking as single-screen days view ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([36a96fc](https://github.com/frostiks777/ai-for-developers-project-386/commit/36a96fce1c9e14361c5978897cf49d2ea0874dd9))
* **ui:** redesign organizer dashboard ([681eb9b](https://github.com/frostiks777/ai-for-developers-project-386/commit/681eb9bf7a3e9fab2bed9ae45ed6afcf518f7fee))
* **ui:** restyle booking dialog ([e6859e9](https://github.com/frostiks777/ai-for-developers-project-386/commit/e6859e95e46657e055949a35383d9e1523ccb769))
* **ui:** restyle booking success ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([13e85f5](https://github.com/frostiks777/ai-for-developers-project-386/commit/13e85f569dc1dd9a576178ea7e3145403984e12f))
* **ui:** restyle booking success screen ([19efa65](https://github.com/frostiks777/ai-for-developers-project-386/commit/19efa653853f7486b65ba26550f3e1a7d6ccf365))
* **ui:** show booking event type in owner list and cap guest booking page height ([89b89cd](https://github.com/frostiks777/ai-for-developers-project-386/commit/89b89cdb8a179b9c21af9dbd716788bb23e64a30))
* **ui:** split organizer panel into screens and add overview ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([59ae6fd](https://github.com/frostiks777/ai-for-developers-project-386/commit/59ae6fd749aa5881f44b236fab28a6204e34ddb4))
* **ui:** unified manage booking page ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([6fa3ef4](https://github.com/frostiks777/ai-for-developers-project-386/commit/6fa3ef45a4c4b9d92466853afe9ab3fc87b4431b))
* **ui:** use event type title in calendar export ([6fe89b0](https://github.com/frostiks777/ai-for-developers-project-386/commit/6fe89b02fbb1309cb212f3b89262f7e4dfe6a1fc))
* validate phone format in booking form ([95422f6](https://github.com/frostiks777/ai-for-developers-project-386/commit/95422f6e41c1d477ce9ccbc02775a1c3a4d26e14))
* **web:** move upcoming events into organizer panel ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([0375839](https://github.com/frostiks777/ai-for-developers-project-386/commit/037583982f1e3d7e0c7c2d3f549cd5a595900ec9))
* **web:** scope whole frontend to active host and add hosts UI ([#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42)) ([7351a52](https://github.com/frostiks777/ai-for-developers-project-386/commit/7351a523b899d9763207148417b3984160570a40))


### Bug Fixes

* **agents:** correct shadcn mcp package name to fix connection closed ([f08ebda](https://github.com/frostiks777/ai-for-developers-project-386/commit/f08ebda6c00ce450a316cd48b32ccec519958c27))
* **api:** require admin auth for bookings list and redirect /events ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([e51d61a](https://github.com/frostiks777/ai-for-developers-project-386/commit/e51d61a314172a33701bedeb458a0fe9cdf4e1c2))
* **availability:** keep slot grid at 30 min, apply buffers as conflict filter ([#89](https://github.com/frostiks777/ai-for-developers-project-386/issues/89)) ([a86150b](https://github.com/frostiks777/ai-for-developers-project-386/commit/a86150bc2e32af1217c4583a915f731193cc4688))
* **availability:** put day toggle and first interval on one row ([fdb9968](https://github.com/frostiks777/ai-for-developers-project-386/commit/fdb99680550f6b09f9d8b36c61143e2520285883))
* bind vite dev server to ipv4 ([b67c374](https://github.com/frostiks777/ai-for-developers-project-386/commit/b67c374c2b5364b1c43814156878509823ef03c1))
* **booking:** seed default event type for new hosts so booking button works ([#45](https://github.com/frostiks777/ai-for-developers-project-386/issues/45)) ([aefb4ce](https://github.com/frostiks777/ai-for-developers-project-386/commit/aefb4cebd020780fc524c50a51554f38b4e029f5))
* **ci:** run checks on every push, not just main ([#90](https://github.com/frostiks777/ai-for-developers-project-386/issues/90)) ([e4d3a32](https://github.com/frostiks777/ai-for-developers-project-386/commit/e4d3a3214a78e0dbeb3935c5554e9c04c8bb6b60))
* **ci:** upgrade vitest to 4 and drop EOL Node 20 from matrix ([32ebb5d](https://github.com/frostiks777/ai-for-developers-project-386/commit/32ebb5d6f55c5c2f99a64e07f2f648a202a73fe1))
* **dashboard:** count only active bookings in meetings counter ([b965094](https://github.com/frostiks777/ai-for-developers-project-386/commit/b965094f32aeffbeeef38816700ab861df71355e))
* **dashboard:** scroll to availability section from sidebar link ([2db4130](https://github.com/frostiks777/ai-for-developers-project-386/commit/2db4130e19fe6026c2acc809725559694daaea62))
* **db:** backfill hostId when migrating old availability_rules ([#20](https://github.com/frostiks777/ai-for-developers-project-386/issues/20)) ([35879d9](https://github.com/frostiks777/ai-for-developers-project-386/commit/35879d9cc41339273c1b28b6f15a87597e631088))
* **demo:** send curl bodies via --data-binary to keep cyrillic Content-Length ([c74d3fa](https://github.com/frostiks777/ai-for-developers-project-386/commit/c74d3fafb08dcf11255de8929672db0e88ccb17a))
* **dev:** wait for API health before starting Vite ([#53](https://github.com/frostiks777/ai-for-developers-project-386/issues/53)) ([d6ff16d](https://github.com/frostiks777/ai-for-developers-project-386/commit/d6ff16d5a10fe15a69b6f8bfe133d7a532043ca0))
* **email:** accept any content type on reminders endpoint ([#86](https://github.com/frostiks777/ai-for-developers-project-386/issues/86)) ([1350d20](https://github.com/frostiks777/ai-for-developers-project-386/commit/1350d20cac1350404ca20a74e646328c360e77f2))
* **panel:** clarify copy text is about cancellation ([#59](https://github.com/frostiks777/ai-for-developers-project-386/issues/59)) ([dc91d6d](https://github.com/frostiks777/ai-for-developers-project-386/commit/dc91d6d3ab9d4372abe2aab5635510268f711e66))
* **panel:** derive week preview days from rules and align grid to the card ([#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76)) ([ebcfa67](https://github.com/frostiks777/ai-for-developers-project-386/commit/ebcfa676b515e3b12ac0c8ee5ac1fefcfce67e5d))
* **panel:** full-width host form fields on mobile ([#66](https://github.com/frostiks777/ai-for-developers-project-386/issues/66)) ([0096a6a](https://github.com/frostiks777/ai-for-developers-project-386/commit/0096a6acc4e96946a844db2b1116eec3c1bd5b63))
* **panel:** keep day row and blocks header inside narrow screens ([#49](https://github.com/frostiks777/ai-for-developers-project-386/issues/49)) ([#74](https://github.com/frostiks777/ai-for-developers-project-386/issues/74)) ([d10cb71](https://github.com/frostiks777/ai-for-developers-project-386/commit/d10cb7180acd4a5c5b134a140a7a174d7551aa36))
* **panel:** refetch bookings when switching panel section ([#69](https://github.com/frostiks777/ai-for-developers-project-386/issues/69)) ([6ed45b7](https://github.com/frostiks777/ai-for-developers-project-386/commit/6ed45b715ed96e2855ebc155b7777f828595bf86))
* **panel:** show meetings in guest week preview ([#52](https://github.com/frostiks777/ai-for-developers-project-386/issues/52)) ([91bea93](https://github.com/frostiks777/ai-for-developers-project-386/commit/91bea9312db131ae9876207865461068671429de))
* **panel:** stretch week preview and hide cancel actions on past bookings ([#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76)) ([8d87341](https://github.com/frostiks777/ai-for-developers-project-386/commit/8d8734177c87a1c06d27efcaa81bc398cb65a016))
* **panel:** обновлять счётчик и списки при переходе между разделами ([#69](https://github.com/frostiks777/ai-for-developers-project-386/issues/69)) ([e6ed597](https://github.com/frostiks777/ai-for-developers-project-386/commit/e6ed597a24e1a465c76341175d934f4be689d109))
* prevent double booking with unique index on bookings.slotId ([9cf1650](https://github.com/frostiks777/ai-for-developers-project-386/commit/9cf1650bec38b1eeda965affab061adc6a5ce4f4))
* **test:** exclude nested node_modules and .opencode from vitest discovery ([73df4e0](https://github.com/frostiks777/ai-for-developers-project-386/commit/73df4e041586dfda774165115f962585ee16be3d))
* **tests:** make TwoWeekGrid fixture date-relative ([#79](https://github.com/frostiks777/ai-for-developers-project-386/issues/79)) ([5ca0c18](https://github.com/frostiks777/ai-for-developers-project-386/commit/5ca0c18d79bb9b5168cdc0031232987a959a219d))
* **ui:** add calendar favicon and stop mobile overflow in panel tabs and hosts ([74aefe6](https://github.com/frostiks777/ai-for-developers-project-386/commit/74aefe657e0d4ff4fedffef48ed643702c67b94c))
* **ui:** add theme toggle to organizer dashboard ([1106299](https://github.com/frostiks777/ai-for-developers-project-386/commit/1106299b03a828e44b1138a64346d1c26010c4d4))
* **ui:** compact availability interval remove control ([8c2bf69](https://github.com/frostiks777/ai-for-developers-project-386/commit/8c2bf6981502a2842aa8ec79adb6541a950b2c02))
* **ui:** fix overflow, sidebar scroll and bookings nav link ([d3f8455](https://github.com/frostiks777/ai-for-developers-project-386/commit/d3f8455c91b0f4e1f70491774771ab42b7cd589f))
* **ui:** hide native scrollbar in booking card columns ([9d72a77](https://github.com/frostiks777/ai-for-developers-project-386/commit/9d72a776a06d3952f26a2a9cae1d83c9571cb3b3))
* **ui:** hide reschedule and cancel for past bookings in my bookings ([#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76)) ([a616d68](https://github.com/frostiks777/ai-for-developers-project-386/commit/a616d68895acd0679901338298fad81d304907ad))
* **ui:** keep organizer sidebar sticky while page scrolls ([3742cd3](https://github.com/frostiks777/ai-for-developers-project-386/commit/3742cd3432ec5f39effd2859ac0b1c7c194925be))
* **ui:** make month calendar fit block height ([d74e847](https://github.com/frostiks777/ai-for-developers-project-386/commit/d74e84746bceaf88ff61799a1468ee370f8a75b0))
* **ui:** show theme toggle on mobile header ([#61](https://github.com/frostiks777/ai-for-developers-project-386/issues/61)) ([284a2d5](https://github.com/frostiks777/ai-for-developers-project-386/commit/284a2d54600a6c1df07a66c4d6c755b0c7602a1e))
* **ui:** use full navigation for dashboard links (basic auth prompt) ([ef4aaf4](https://github.com/frostiks777/ai-for-developers-project-386/commit/ef4aaf4b2baeb29e7d6ad455be0db252e185fa90))
* **ui:** use readable select colors for event type format in dark theme ([2abaf61](https://github.com/frostiks777/ai-for-developers-project-386/commit/2abaf61324d67a4367143eecd9b2f09f687dad37))
* **web:** correct weekday labels and show cancel time in guest zone ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([6dc208b](https://github.com/frostiks777/ai-for-developers-project-386/commit/6dc208b06b06f872c7842e115ed9589e37d4ecfc))
* **web:** hide cancel for past meetings in my bookings ([#60](https://github.com/frostiks777/ai-for-developers-project-386/issues/60)) ([0789c54](https://github.com/frostiks777/ai-for-developers-project-386/commit/0789c546905163f44fb246ccf05c1fbd794e1243))
* **web:** keep wizard form data when switching date ([#65](https://github.com/frostiks777/ai-for-developers-project-386/issues/65)) ([a0cd796](https://github.com/frostiks777/ai-for-developers-project-386/commit/a0cd7968852becc7c44063e8204ae2c47846fb3b))
* **web:** mobile wizard dates, availability slots and panel tabs ([#56](https://github.com/frostiks777/ai-for-developers-project-386/issues/56), [#57](https://github.com/frostiks777/ai-for-developers-project-386/issues/57), [#58](https://github.com/frostiks777/ai-for-developers-project-386/issues/58), [#62](https://github.com/frostiks777/ai-for-developers-project-386/issues/62)) ([a7eac00](https://github.com/frostiks777/ai-for-developers-project-386/commit/a7eac00df95ae868604732ed1f3616578fb46fe3))
* **web:** мобильные правки [#65](https://github.com/frostiks777/ai-for-developers-project-386/issues/65)-[#66](https://github.com/frostiks777/ai-for-developers-project-386/issues/66) ([c5f9c63](https://github.com/frostiks777/ai-for-developers-project-386/commit/c5f9c632fae66de86fe41fc8f6276083fa4bd080))
* **web:** мобильные правки приёмки ([#56](https://github.com/frostiks777/ai-for-developers-project-386/issues/56)-[#62](https://github.com/frostiks777/ai-for-developers-project-386/issues/62)) ([e225d05](https://github.com/frostiks777/ai-for-developers-project-386/commit/e225d05b33d51a2c30b27d279c796c23c056bdcc))

## [1.23.2](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.23.1...v1.23.2) (2026-09-29)


### Bug Fixes

* **ci:** run checks on every push, not just main ([#90](https://github.com/frostiks777/ai-for-developers-project-386/issues/90)) ([e4d3a32](https://github.com/frostiks777/ai-for-developers-project-386/commit/e4d3a3214a78e0dbeb3935c5554e9c04c8bb6b60))

## [1.23.2](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.23.1...v1.23.2) (2026-09-29)


### Bug Fixes

* **ci:** run checks on every push, not just main ([#90](https://github.com/frostiks777/ai-for-developers-project-386/issues/90)) ([b411114](https://github.com/frostiks777/ai-for-developers-project-386/commit/b411114b263ab6d4a750189797d7f538af3cb1c6))

## [1.23.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.23.0...v1.23.1) (2026-09-29)


### Bug Fixes

* **email:** accept any content type on reminders endpoint ([#86](https://github.com/frostiks777/ai-for-developers-project-386/issues/86)) ([16cdc24](https://github.com/frostiks777/ai-for-developers-project-386/commit/16cdc244909a1d81935c0375d33c29f952fda549))

## [1.23.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.22.2...v1.23.0) (2026-09-29)


### Features

* **email:** booking notifications and reminders via Brevo ([#83](https://github.com/frostiks777/ai-for-developers-project-386/issues/83)) ([e7cf43e](https://github.com/frostiks777/ai-for-developers-project-386/commit/e7cf43e009e83ba7e9699b028d1cab46de47a729))

## [1.22.2](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.22.1...v1.22.2) (2026-09-29)


### Bug Fixes

* **tests:** make TwoWeekGrid fixture date-relative ([#79](https://github.com/frostiks777/ai-for-developers-project-386/issues/79)) ([5245815](https://github.com/frostiks777/ai-for-developers-project-386/commit/52458152184b16c68ce3133f28b8c22a8194a51c))
* **ui:** hide reschedule and cancel for past bookings in my bookings ([#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76)) ([df83073](https://github.com/frostiks777/ai-for-developers-project-386/commit/df830732a90ca98cd5d03f75539ec5840203c149))

## [1.22.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.22.0...v1.22.1) (2026-09-28)


### Bug Fixes

* **panel:** derive week preview days from rules and align grid to the card ([#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76)) ([885a073](https://github.com/frostiks777/ai-for-developers-project-386/commit/885a07329419a29281552b5b9b1ea502981c5b39))
* **ui:** add calendar favicon and stop mobile overflow in panel tabs and hosts ([4182f1f](https://github.com/frostiks777/ai-for-developers-project-386/commit/4182f1f960ce439e203fdbf6085bd0b157a237c5))

## [1.22.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.21.3...v1.22.0) (2026-09-28)


### Features

* **security:** protect public booking with Turnstile and per-IP rate limit ([#46](https://github.com/frostiks777/ai-for-developers-project-386/issues/46)) ([05c923b](https://github.com/frostiks777/ai-for-developers-project-386/commit/05c923b082e925e271e2416d980d8e2d60c35b3d))


### Bug Fixes

* **panel:** stretch week preview and hide cancel actions on past bookings ([#76](https://github.com/frostiks777/ai-for-developers-project-386/issues/76)) ([b502e08](https://github.com/frostiks777/ai-for-developers-project-386/commit/b502e0892107aeedeecd581f7ac2f967f6752984))

## [1.21.3](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.21.2...v1.21.3) (2026-09-28)


### Bug Fixes

* **panel:** keep day row and blocks header inside narrow screens ([#49](https://github.com/frostiks777/ai-for-developers-project-386/issues/49)) ([#74](https://github.com/frostiks777/ai-for-developers-project-386/issues/74)) ([8b49dda](https://github.com/frostiks777/ai-for-developers-project-386/commit/8b49dda0578ad5d9cdd840133d3342a997415b2e))

## [1.21.2](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.21.1...v1.21.2) (2026-09-28)


### Bug Fixes

* **panel:** refetch bookings when switching panel section ([#69](https://github.com/frostiks777/ai-for-developers-project-386/issues/69)) ([4bbfafc](https://github.com/frostiks777/ai-for-developers-project-386/commit/4bbfafc49ea2f05026c15ad56cc329dbf5e2e847))
* **panel:** обновлять счётчик и списки при переходе между разделами ([#69](https://github.com/frostiks777/ai-for-developers-project-386/issues/69)) ([3c41b7c](https://github.com/frostiks777/ai-for-developers-project-386/commit/3c41b7c7f94d134cad2a36399e574e0d82578308))

## [1.21.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.21.0...v1.21.1) (2026-09-28)


### Bug Fixes

* **panel:** clarify copy text is about cancellation ([#59](https://github.com/frostiks777/ai-for-developers-project-386/issues/59)) ([5fa5a01](https://github.com/frostiks777/ai-for-developers-project-386/commit/5fa5a011fea50d61dbd2f6813a8f28bde19f5b51))
* **panel:** full-width host form fields on mobile ([#66](https://github.com/frostiks777/ai-for-developers-project-386/issues/66)) ([95cf3e3](https://github.com/frostiks777/ai-for-developers-project-386/commit/95cf3e36102d6f684f26e9c8c12b9156eb52ff59))
* **ui:** show theme toggle on mobile header ([#61](https://github.com/frostiks777/ai-for-developers-project-386/issues/61)) ([2b9517e](https://github.com/frostiks777/ai-for-developers-project-386/commit/2b9517e60f04864dc4e4dceaf506d0e24efaa2aa))
* **web:** hide cancel for past meetings in my bookings ([#60](https://github.com/frostiks777/ai-for-developers-project-386/issues/60)) ([5daa965](https://github.com/frostiks777/ai-for-developers-project-386/commit/5daa965f48d0004a78127401184ebe7179a4bad3))
* **web:** keep wizard form data when switching date ([#65](https://github.com/frostiks777/ai-for-developers-project-386/issues/65)) ([44193ce](https://github.com/frostiks777/ai-for-developers-project-386/commit/44193cebc3621435daa7a2ce48f5c3b90215fc22))
* **web:** mobile wizard dates, availability slots and panel tabs ([#56](https://github.com/frostiks777/ai-for-developers-project-386/issues/56), [#57](https://github.com/frostiks777/ai-for-developers-project-386/issues/57), [#58](https://github.com/frostiks777/ai-for-developers-project-386/issues/58), [#62](https://github.com/frostiks777/ai-for-developers-project-386/issues/62)) ([3decb4d](https://github.com/frostiks777/ai-for-developers-project-386/commit/3decb4d46126741647d4efe15f619394a0b7c881))
* **web:** мобильные правки [#65](https://github.com/frostiks777/ai-for-developers-project-386/issues/65)-[#66](https://github.com/frostiks777/ai-for-developers-project-386/issues/66) ([976f1f2](https://github.com/frostiks777/ai-for-developers-project-386/commit/976f1f2258f54602202d9d5a8640d3d110346b84))
* **web:** мобильные правки приёмки ([#56](https://github.com/frostiks777/ai-for-developers-project-386/issues/56)-[#62](https://github.com/frostiks777/ai-for-developers-project-386/issues/62)) ([4124ff6](https://github.com/frostiks777/ai-for-developers-project-386/commit/4124ff69fad3f2b0f9963d2be5d74f9e0401f302))

## [1.21.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.20.0...v1.21.0) (2026-09-28)


### Features

* **api:** generate slots in host time zone ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([92074b4](https://github.com/frostiks777/ai-for-developers-project-386/commit/92074b442d044fb05ed9e6263c6225959ad0ac2c))
* redesign v2 «Мята и солнце» (этапы 3–13) ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([e7a56ba](https://github.com/frostiks777/ai-for-developers-project-386/commit/e7a56ba14ef6c202ec460156204817546b25dbc4))
* **ui:** add v2 tokens, ambient background and glass surfaces ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([e023cc4](https://github.com/frostiks777/ai-for-developers-project-386/commit/e023cc4d41abec82811ae9c5d89f731e5a797750))
* **ui:** add week view to desktop booking ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([47f2deb](https://github.com/frostiks777/ai-for-developers-project-386/commit/47f2deb70b8b9d3499a0f995c49a015291fa109b))
* **ui:** keep form data and suggest nearby slots on conflict ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([eec5a16](https://github.com/frostiks777/ai-for-developers-project-386/commit/eec5a163e798a69a4f31c6fdf6bd9cf88f2a08ba))
* **ui:** landing formats and my bookings in v2 style ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([b356ea8](https://github.com/frostiks777/ai-for-developers-project-386/commit/b356ea85d5a1e18991cf4d4be2ee38761d48e542))
* **ui:** mobile booking wizard ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([d69d90a](https://github.com/frostiks777/ai-for-developers-project-386/commit/d69d90ac73db6bd68694f68d7869edd5b7f5d324))
* **ui:** redesign desktop booking as single-screen days view ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([4c6ffd5](https://github.com/frostiks777/ai-for-developers-project-386/commit/4c6ffd5ba970c8e04e254e40d1cd5abcf62fac8a))
* **ui:** restyle booking success ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([dcb5d52](https://github.com/frostiks777/ai-for-developers-project-386/commit/dcb5d52c25a70e52ab7ea5779f74f0944e641e0e))
* **ui:** split organizer panel into screens and add overview ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([e7da573](https://github.com/frostiks777/ai-for-developers-project-386/commit/e7da57384f5c0c87563be3a080c0e5641797d53d))
* **ui:** unified manage booking page ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([7189747](https://github.com/frostiks777/ai-for-developers-project-386/commit/718974743956a7718542cbd4b363883cc6a93c59))


### Bug Fixes

* **agents:** correct shadcn mcp package name to fix connection closed ([9308040](https://github.com/frostiks777/ai-for-developers-project-386/commit/930804027366faca9c7a5de284a3f8aa52dbf860))
* **dev:** wait for API health before starting Vite ([#53](https://github.com/frostiks777/ai-for-developers-project-386/issues/53)) ([ae1543a](https://github.com/frostiks777/ai-for-developers-project-386/commit/ae1543ad5464a02f488fdef36eceed3f3d83c4d0))
* **panel:** show meetings in guest week preview ([#52](https://github.com/frostiks777/ai-for-developers-project-386/issues/52)) ([ac2e9cc](https://github.com/frostiks777/ai-for-developers-project-386/commit/ac2e9cc5278794cfaf9275f8f74a0f12446ae045))
* **test:** exclude nested node_modules and .opencode from vitest discovery ([0f0be20](https://github.com/frostiks777/ai-for-developers-project-386/commit/0f0be2098ead2506b156e718c82a6ff03c694be3))

## [1.20.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.19.1...v1.20.0) (2026-09-28)


### Features

* redesign v2 mint — stages 0-2 ([#48](https://github.com/frostiks777/ai-for-developers-project-386/issues/48)) ([#50](https://github.com/frostiks777/ai-for-developers-project-386/issues/50)) ([079662c](https://github.com/frostiks777/ai-for-developers-project-386/commit/079662c7698f2f7003d14da3633925f28d6ff4ba))

## [1.19.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.19.0...v1.19.1) (2026-09-25)


### Bug Fixes

* **booking:** seed default event type for new hosts so booking button works ([#45](https://github.com/frostiks777/ai-for-developers-project-386/issues/45)) ([c848c02](https://github.com/frostiks777/ai-for-developers-project-386/commit/c848c02f46ff13aad1cf8f300321de8d38f8db0c))

## [1.19.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.18.0...v1.19.0) (2026-09-25)


### Features

* **api:** add hosts CRUD to contract and make list public ([#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42)) ([172a7dd](https://github.com/frostiks777/ai-for-developers-project-386/commit/172a7dd8a2c4d4fedb9379237fd4e3212b0b9294))
* **web:** scope whole frontend to active host and add hosts UI ([#42](https://github.com/frostiks777/ai-for-developers-project-386/issues/42)) ([f5b2c43](https://github.com/frostiks777/ai-for-developers-project-386/commit/f5b2c43ecd25e6e82b065c9455588f5cfebe3365))

## [1.18.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.17.1...v1.18.0) (2026-09-25)


### Features

* **server:** scope availability rules per host ([#41](https://github.com/frostiks777/ai-for-developers-project-386/issues/41)) ([e90c50b](https://github.com/frostiks777/ai-for-developers-project-386/commit/e90c50b2bd89923a2638843a0380d53b4d7f9ca4))

## [1.17.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.17.0...v1.17.1) (2026-09-25)


### Bug Fixes

* **demo:** send curl bodies via --data-binary to keep cyrillic Content-Length ([9e9d0b9](https://github.com/frostiks777/ai-for-developers-project-386/commit/9e9d0b9435a31801310b598e111daf425aecce9d))

## [1.17.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.16.0...v1.17.0) (2026-09-25)


### Features

* **booking:** add on-device my-bookings page ([1392278](https://github.com/frostiks777/ai-for-developers-project-386/commit/1392278df983f66358e4b7c83cf354636477f0b4))

## [1.16.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.15.0...v1.16.0) (2026-09-25)


### Features

* **server:** add multi-host model for slots and bookings ([bcd67f2](https://github.com/frostiks777/ai-for-developers-project-386/commit/bcd67f23369689125bd96da5b326427a8e0a743f))

## [1.15.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.14.0...v1.15.0) (2026-09-25)


### Features

* **dashboard:** make sidebar logo link to home ([eb30abd](https://github.com/frostiks777/ai-for-developers-project-386/commit/eb30abd1f1767357999f97f3c2c9839d4f0851b1))

## [1.14.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.13.1...v1.14.0) (2026-09-25)


### Features

* **server:** require auth for admin api mutations ([6fab0bd](https://github.com/frostiks777/ai-for-developers-project-386/commit/6fab0bd156b06f27c6db7977c0505b8af567e177))

## [1.13.1](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.13.0...v1.13.1) (2026-09-25)


### Bug Fixes

* **ui:** use full navigation for dashboard links (basic auth prompt) ([6699656](https://github.com/frostiks777/ai-for-developers-project-386/commit/6699656c10e8fbff5344e6a2ab87a772cf9bc5ad))

## [1.13.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.12.0...v1.13.0) (2026-09-25)


### Features

* **ui:** add temporary dashboard access button to header ([b52352d](https://github.com/frostiks777/ai-for-developers-project-386/commit/b52352d8e3f844b79e1cd4e197ddf3c3346ff682))

## [1.12.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.11.0...v1.12.0) (2026-09-25)


### Features

* **api:** split slot buffer into before and after ([4640244](https://github.com/frostiks777/ai-for-developers-project-386/commit/464024413545815cc002c2d24b75b4a317b3193a))
* **availability:** use separate before and after buffers ([f205bc2](https://github.com/frostiks777/ai-for-developers-project-386/commit/f205bc271ba3e38d29e59b4f3eead80be09605d0))
* **booking:** add uuid self-service routes and cancel details ([937cbb7](https://github.com/frostiks777/ai-for-developers-project-386/commit/937cbb7b1a8a6c690b28bf60d9d84ea56ea27db0))
* **dashboard:** add status tabs, search and horizon presets ([c42fc2e](https://github.com/frostiks777/ai-for-developers-project-386/commit/c42fc2e989505d6358ce92da2360b343a7da507d))


### Bug Fixes

* **ui:** fix overflow, sidebar scroll and bookings nav link ([66296c5](https://github.com/frostiks777/ai-for-developers-project-386/commit/66296c504b2afd7c98351e122df12bb96f7f6232))

## [1.11.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.10.0...v1.11.0) (2026-09-25)


### Features

* **api:** add guests, consent and idempotency key to booking contract ([407bf0d](https://github.com/frostiks777/ai-for-developers-project-386/commit/407bf0d4064dfbdf74a44f2101090f951d2b3024))
* **availability:** redesign settings form with switch, presets and validation ([d44ab9d](https://github.com/frostiks777/ai-for-developers-project-386/commit/d44ab9d5d5792b1f2a3217efadda565630fb80b2))
* **booking:** add cancellation reason and confirmation modal ([bcd7f15](https://github.com/frostiks777/ai-for-developers-project-386/commit/bcd7f158f6fb98283e49f633dd576f968b340c42))
* **booking:** add phone mask, stricter name, 409 alert and direct cancel ([495f7a9](https://github.com/frostiks777/ai-for-developers-project-386/commit/495f7a978edb471cab114343294a718035081be9))
* **booking:** add timezone search and 12/24 hour format toggle ([500f134](https://github.com/frostiks777/ai-for-developers-project-386/commit/500f134458d31881b6ae51b6f10113cf6d425bcf))
* **booking:** require consent, collect guests and dedupe by idempotency key ([af4133a](https://github.com/frostiks777/ai-for-developers-project-386/commit/af4133aaf5ebdbafa953db49036fffb8cb8bc588))
* **dashboard:** add time blocks link to sidebar ([00b551c](https://github.com/frostiks777/ai-for-developers-project-386/commit/00b551c9f43a8fbf28435ee3e172a05b75f93045))
* **db:** migrate from SQLite to PostgreSQL (Neon) with PGlite tests ([f1f43c5](https://github.com/frostiks777/ai-for-developers-project-386/commit/f1f43c50e446bccbc65f7254689c4c76ebda07e8))
* **events:** add upcoming events page and confirmed booking route ([9f39d5a](https://github.com/frostiks777/ai-for-developers-project-386/commit/9f39d5a5b3d7dd446bdf9714b31dda9610dc9f19))
* **schedule:** add manual time blocks (BlockTimeModal + API) ([b62ebef](https://github.com/frostiks777/ai-for-developers-project-386/commit/b62ebeff22797f2cfc55459ff6fa8ad584913889))
* **ui:** add public nav tabs to app header ([6b0d8a9](https://github.com/frostiks777/ai-for-developers-project-386/commit/6b0d8a967ad11cdaf3ed8243973f2ee4d33ea1c5))
* **ui:** use event type title in calendar export ([0c10fe2](https://github.com/frostiks777/ai-for-developers-project-386/commit/0c10fe26baaec97f16faec26720e1e2c80d9672a))


### Bug Fixes

* **availability:** put day toggle and first interval on one row ([828119d](https://github.com/frostiks777/ai-for-developers-project-386/commit/828119d6d7130bd67e110aa5a204742c73897108))
* **dashboard:** count only active bookings in meetings counter ([075cad2](https://github.com/frostiks777/ai-for-developers-project-386/commit/075cad2e7231fb1c6c8cdce6e1cef4b8302ec1f4))
* **ui:** compact availability interval remove control ([af2a1aa](https://github.com/frostiks777/ai-for-developers-project-386/commit/af2a1aaf9bd6552bbdb67b7a6bfb28aa2975f917))

## [1.10.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.9.0...v1.10.0) (2026-09-24)


### Features

* **api:** add availability ranges settings and form ([#22](https://github.com/frostiks777/ai-for-developers-project-386/issues/22)) ([d0585e5](https://github.com/frostiks777/ai-for-developers-project-386/commit/d0585e511da6cc831ac5637512672fe3b9c31d6b))
* **api:** create bookings via v1 with type and conflict handling ([#24](https://github.com/frostiks777/ai-for-developers-project-386/issues/24)) ([912d3d0](https://github.com/frostiks777/ai-for-developers-project-386/commit/912d3d0b04c927fa4192e7ad0c903cbd031a8a82))
* **api:** filter slots by event type and add guest type picker ([#23](https://github.com/frostiks777/ai-for-developers-project-386/issues/23)) ([e4ac65d](https://github.com/frostiks777/ai-for-developers-project-386/commit/e4ac65d3025ddf91d441105638ad582b5b41a16c))
* **api:** migrate frontend to generated SDK ([#25](https://github.com/frostiks777/ai-for-developers-project-386/issues/25)) ([98b95b7](https://github.com/frostiks777/ai-for-developers-project-386/commit/98b95b7f4db9a0ae42093881d99412cadc91220f))
* **booking:** cancel and reschedule via v1 public id ([#30](https://github.com/frostiks777/ai-for-developers-project-386/issues/30)) ([60e0de7](https://github.com/frostiks777/ai-for-developers-project-386/commit/60e0de739a59fe1f3623be15f1e96777b180ceda))
* **booking:** reflect selected event type in host info panel ([b676f72](https://github.com/frostiks777/ai-for-developers-project-386/commit/b676f72116d8b19b52a9ab02b3d2d3fd77ec05b7))
* **dashboard:** reflect booking status in owner list and cancel via v1 ([#31](https://github.com/frostiks777/ai-for-developers-project-386/issues/31)) ([3176e6c](https://github.com/frostiks777/ai-for-developers-project-386/commit/3176e6cba5df4ba6b987fb19c425c92503d270a3))
* **test:** contract tests and e2e Playwright gate ([#26](https://github.com/frostiks777/ai-for-developers-project-386/issues/26)) ([387c97b](https://github.com/frostiks777/ai-for-developers-project-386/commit/387c97b4865d56a949ebda72199644fe2be751aa))
* **ui:** show booking event type in owner list and cap guest booking page height ([134e023](https://github.com/frostiks777/ai-for-developers-project-386/commit/134e0238c343f8dc5039f2b4be5f64e2d18ea546))


### Bug Fixes

* **db:** backfill hostId when migrating old availability_rules ([#20](https://github.com/frostiks777/ai-for-developers-project-386/issues/20)) ([7b526b6](https://github.com/frostiks777/ai-for-developers-project-386/commit/7b526b68261770be59346fe56a9998162dd83b89))
* **ui:** hide native scrollbar in booking card columns ([edb3dc7](https://github.com/frostiks777/ai-for-developers-project-386/commit/edb3dc799b1611584cc430c472314300c0afa028))
* **ui:** keep organizer sidebar sticky while page scrolls ([63a3643](https://github.com/frostiks777/ai-for-developers-project-386/commit/63a3643b53d84752c99a5b1acfd89a5f7984244c))
* **ui:** make month calendar fit block height ([4e4ddb6](https://github.com/frostiks777/ai-for-developers-project-386/commit/4e4ddb638e946e83485ad000963f9caec45daa56))
* **ui:** use readable select colors for event type format in dark theme ([3dea80d](https://github.com/frostiks777/ai-for-developers-project-386/commit/3dea80d76ca1b145a8c00fc10173f36fa022e535))

## [1.9.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.8.0...v1.9.0) (2026-09-24)


### Features

* **api:** add event types CRUD and owner editor ([#21](https://github.com/frostiks777/ai-for-developers-project-386/issues/21)) ([1cf1dd5](https://github.com/frostiks777/ai-for-developers-project-386/commit/1cf1dd51ae90baed56ef1c3b09eae1fb51026cbe))
* **db:** add event types, booking status and availability ranges schema ([#20](https://github.com/frostiks777/ai-for-developers-project-386/issues/20)) ([899ed88](https://github.com/frostiks777/ai-for-developers-project-386/commit/899ed88901c23260660a2a0295962a84209058c9))

## [1.8.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.7.0...v1.8.0) (2026-09-24)


### Features

* **api:** add TypeSpec contract for /api/v1 ([a875980](https://github.com/frostiks777/ai-for-developers-project-386/commit/a8759800179f7d66d2e5cc1627941f9dbde0b113))
* **api:** generate OpenAPI and client SDK from TypeSpec via api:generate ([18b33e0](https://github.com/frostiks777/ai-for-developers-project-386/commit/18b33e0193e64e6c98f37c782581def92a34b676))
* **api:** generate server API types from OpenAPI ([8ed202f](https://github.com/frostiks777/ai-for-developers-project-386/commit/8ed202f01cf328c69223b6ad6bd1714f7a2807b8))
* **booking:** add landing page and move booking to /book/:slug ([d45367d](https://github.com/frostiks777/ai-for-developers-project-386/commit/d45367de64f2c749c2dfb312a1b416fe62a79807))


### Bug Fixes

* **dashboard:** scroll to availability section from sidebar link ([acc168e](https://github.com/frostiks777/ai-for-developers-project-386/commit/acc168e564e152ec8864140fc91b4b73f1e7a0cd))

## [1.7.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.6.0...v1.7.0) (2026-09-23)


### Features

* allow rescheduling a booking by token link ([6d9cfff](https://github.com/frostiks777/ai-for-developers-project-386/commit/6d9cfff7599d694c4865e6aaa8cdf642219ace81))
* **server:** add hosts table and versioned API v1 ([445b40c](https://github.com/frostiks777/ai-for-developers-project-386/commit/445b40cc608b529a88b3b0cd9ddcb95782df27bc))
* **ui:** add design tokens, fonts and light/dark theme ([3c97980](https://github.com/frostiks777/ai-for-developers-project-386/commit/3c97980e0448dd0cb5fdcb2ab8cb8100b7a0d0b6))
* **ui:** add mobile booking layout ([b163d03](https://github.com/frostiks777/ai-for-developers-project-386/commit/b163d036a467c219d0d9adddd4f35bf0e0d8e5c4))
* **ui:** redesign booking page desktop layout ([14df808](https://github.com/frostiks777/ai-for-developers-project-386/commit/14df808e8463d0f34cd3a1505030a01fb10dd899))
* **ui:** redesign organizer dashboard ([7293469](https://github.com/frostiks777/ai-for-developers-project-386/commit/7293469fc6e06a386f1a705f7501eff602533053))
* **ui:** restyle booking dialog ([8d0513a](https://github.com/frostiks777/ai-for-developers-project-386/commit/8d0513a11c7cf5ea2f0acf2453d7cb8ce3177236))
* **ui:** restyle booking success screen ([db5aec2](https://github.com/frostiks777/ai-for-developers-project-386/commit/db5aec205256e0663bcd49be0ec6444ec2e68a35))


### Bug Fixes

* **ui:** add theme toggle to organizer dashboard ([5a4e95e](https://github.com/frostiks777/ai-for-developers-project-386/commit/5a4e95e5d7fdae7cefb61628eec6d51858eb7706))

## [1.6.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.5.0...v1.6.0) (2026-09-23)


### Features

* allow cancelling a booking by token link ([d39fc31](https://github.com/frostiks777/ai-for-developers-project-386/commit/d39fc316e249d503995fc1625d1ca54c5da9a26c))

## [1.5.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.4.0...v1.5.0) (2026-09-23)


### Features

* add ics and Google Calendar export on success screen ([7273933](https://github.com/frostiks777/ai-for-developers-project-386/commit/72739331974b5f74a66f7bbad3aeb1b325c92cc8))

## [1.4.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.3.0...v1.4.0) (2026-09-23)


### Features

* add back button to booking success screen ([25d58bd](https://github.com/frostiks777/ai-for-developers-project-386/commit/25d58bd0d65606671b0f0e94e5c362266c7c4186))

## [1.3.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.2.0...v1.3.0) (2026-09-23)


### Features

* add organizer dashboard with cancellation and availability ([1d0c3f0](https://github.com/frostiks777/ai-for-developers-project-386/commit/1d0c3f04bad5645eabd82e3dca93237b0650d0bc))

## [1.2.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.1.0...v1.2.0) (2026-09-23)


### Features

* add month calendar with date filtering ([a4af7e8](https://github.com/frostiks777/ai-for-developers-project-386/commit/a4af7e80f56010edf26d2051d099e8ab5031186f))
* add optional booking comment field ([bca6297](https://github.com/frostiks777/ai-for-developers-project-386/commit/bca6297c392624acfb96eaf852c1fc0eb1f3ed1b))
* add time zone selector and zone-aware formatting ([97afbf3](https://github.com/frostiks777/ai-for-developers-project-386/commit/97afbf38812d36ff7bfe38d68f2cfd92c6db7e31))
* generate slots from availability rules ([e5715ed](https://github.com/frostiks777/ai-for-developers-project-386/commit/e5715ed4642fd3363e16e845f1c5a66bc6dc2153))
* make booking phone optional ([88af484](https://github.com/frostiks777/ai-for-developers-project-386/commit/88af484514c971b6fd77b6d43c38bfc23a6dcca8))
* show success screen with booking summary ([1c75422](https://github.com/frostiks777/ai-for-developers-project-386/commit/1c75422054c1318b70a37194ec17f10a9c7a1752))


### Bug Fixes

* prevent double booking with unique index on bookings.slotId ([f305a41](https://github.com/frostiks777/ai-for-developers-project-386/commit/f305a4125e66d4906e5fcb879939253cb269cf98))

## [1.1.0](https://github.com/frostiks777/ai-for-developers-project-386/compare/v1.0.0...v1.1.0) (2026-09-23)


### Features

* **api:** add GET /api/bookings with slot details ([5e7c56c](https://github.com/frostiks777/ai-for-developers-project-386/commit/5e7c56ccb2481b8c0f2980a99926170b800fd5c4))


### Bug Fixes

* **ci:** upgrade vitest to 4 and drop EOL Node 20 from matrix ([d5954e7](https://github.com/frostiks777/ai-for-developers-project-386/commit/d5954e7787596d243e80e1a7d8e7a98f954cd078))

## 1.0.0 (2026-09-22)


### Features

* add call calendar app skeleton ([21b287e](https://github.com/frostiks777/ai-for-developers-project-386/commit/21b287eb297aa8c3aabd58be70633b25250184c9))
* add slot booking dialog with toasts ([722d27c](https://github.com/frostiks777/ai-for-developers-project-386/commit/722d27c50aa67eb2f4fe4d4d23c5a66432b7bac0))
* require email on booking and hide past slots ([b485216](https://github.com/frostiks777/ai-for-developers-project-386/commit/b4852167bd01a7803914716a90ca1793473459c0))
* serve SPA from Fastify and add Render deploy config ([1202442](https://github.com/frostiks777/ai-for-developers-project-386/commit/12024421bab50ff36e97489185bf7e5cdf9b51c9))
* validate phone format in booking form ([2afafeb](https://github.com/frostiks777/ai-for-developers-project-386/commit/2afafebe21e39e63788eb2f2b01ba70aa91c5138))


### Bug Fixes

* bind vite dev server to ipv4 ([3c94887](https://github.com/frostiks777/ai-for-developers-project-386/commit/3c948876e40503178a436ec533d7c163e1aeda8f))
