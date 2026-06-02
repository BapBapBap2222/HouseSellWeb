# Tasks chi tiet - Plan 006 (V6 AI Price Prediction Vietnam)

## Quy tac thuc thi

- Moi task atomic, co input/output ro rang.
- Moi task gan skill chinh.
- Moi task bat buoc qua 4 gate: Logic, Nghiep vu, Security, Test.
- Khong chuyen phase neu dependency chua pass.

## Dependency map

- Phase A (contract) -> bat buoc truoc implement.
- Phase B (ML + BE) -> can contract chot.
- Phase C (FE sync) -> can BE schema da on dinh.
- Phase D (verify + review memory) -> chot release V6.

## Phase A - Preflight & Contract

### [x] T000 - Preflight theo rule (DONE)
- Skill chinh: `writing-plans`
- Muc tieu: xac nhan da doc rule/guide/review truoc khi chot V6.
- Input:
  - `tasks-manager/review/REVIEW.md`
  - `tasks-manager/guilde/backend_guide_ver3.md`
  - `tasks-manager/.claude/rules/*.md`
- Output: context preflight cho Plan 006.
- Dependency: none.
- Gate evidence: da doi chieu rule preflight/planning/gates/contract-sync.

### [x] T001 - Trich contract prediction tu guide v3 (DONE)
- Skill chinh: `software-architecture`
- Muc tieu: lay baseline guide (`/api/predict/`) de mapping sang runtime (`/api/prediction/`).
- Output:
  - `prediction-contract-mapping.md` phan baseline.
- Dependency: T000.

### [x] T002 - Gap analysis guide vs code runtime (DONE)
- Skill chinh: `software-architecture`
- Muc tieu: chi ro sai khac schema California -> Vietnam.
- Input:
  - `Be/prediction/*`
  - `FE/src/pages/PricePrediction.tsx`
  - `LinearRegressionModel/models/*`
- Output:
  - `prediction-contract-mapping.md` co bang truoc/sau.
- Dependency: T001.

### [x] T003 - Chot contract V6 cuoi (DONE)
- Skill chinh: `software-architecture`
- Muc tieu: khoa request/response schema V6 prediction.
- Output:
  - Contract cuoi trong `prediction-contract-mapping.md`.
- Dependency: T002.

## Phase B - ML Artifact + Backend Integration

### [x] T004 - Train model tu vietnam-real-estates va xuat artifact (DONE)
- Skill chinh: `python-pro`
- Muc tieu: train LR pipeline theo schema Vietnam, xuat `vietnam.pkl`.
- Input:
  - `LinearRegressionModel/data/vietnam-real-estates/shard_*.parquet`
- Output:
  - `LinearRegressionModel/train_vietnam_lr.py`
  - `LinearRegressionModel/models/vietnam.pkl`
  - `LinearRegressionModel/models/lr_pipeline.joblib`
  - `LinearRegressionModel/models/lr_pipeline_metrics.json`
- Dependency: T003.

### [x] T005 - Chuan hoa serializer prediction theo schema V6 (DONE)
- Skill chinh: `django-pro`
- Muc tieu: serializer validate request payload Vietnam.
- Output:
  - `Be/prediction/serializers.py`.
- Dependency: T004.

### [x] T006 - Chuan hoa service model loading + predict logic (DONE)
- Skill chinh: `python-pro`
- Muc tieu:
  - load `vietnam.pkl` (fallback `lr_pipeline.joblib`)
  - map input feature dung thu tu model
  - tra response business object V6
- Output:
  - `Be/prediction/services.py`.
- Dependency: T005.

### [x] T007 - Cap nhat test matrix backend prediction (DONE)
- Skill chinh: `python-testing-patterns`
- Muc tieu: test payload hop le + payload invalid.
- Output:
  - `Be/prediction/tests.py`.
- Dependency: T006.

### [x] T008 - Verify backend runtime (DONE)
- Skill chinh: `python-testing-patterns`
- Muc tieu: co bang chung backend pass.
- Command:
  - `python manage.py test prediction`
- Dependency: T007.

## Phase C - Frontend Contract Sync

### [x] T009 - Dong bo FE payload theo schema V6 (DONE)
- Skill chinh: `typescript-pro`
- Muc tieu: bo field California, gui dung payload V6 cho endpoint `/api/prediction/`.
- Output:
  - `FE/src/pages/PricePrediction.tsx`.
- Dependency: T006.

### [x] T010 - Cap nhat state/render prediction page theo V6 (DONE)
- Skill chinh: `typescript-pro`
- Muc tieu:
  - form fields theo schema Vietnam
  - map center sang VN
  - bo block map image California
- Output:
  - `FE/src/pages/PricePrediction.tsx`.
- Dependency: T009.

### [x] T011 - Verify FE build (DONE)
- Skill chinh: `typescript-pro`
- Muc tieu: xac nhan compile/build pass sau sync contract.
- Command:
  - `npm run build`
- Dependency: T010.

## Phase D - Pending Hardening / Cleanup

### [x] T012 - Manual smoke test API+FE theo checklist (DONE)
- Skill chinh: `software-architecture`
- Muc tieu: run checklist C01..Cxx cho luong prediction tren local runtime.
- Output:
  - Cap nhat ket qua vao `prediction-regression-checklist.md`.
- Dependency: T011.
- Evidence:
  - Da chay browser smoke C05-C07 bang `node FE/scripts/run-c05-c07-smoke.mjs`.
  - Report luu tai `tasks-manager/task/plan-006/evidence/c05-c07-smoke-report.json`.
  - C05/C06/C07 da duoc danh dau PASS trong checklist.

### [x] T013 - Chuan hoa unicode/noi dung text tren prediction page (DONE)
- Skill chinh: `typescript-pro`
- Muc tieu: fix text mojibake tren FE/BE docs va default string de tranh data quality issue.
- Output:
  - file text tai `FE/src/pages/PricePrediction.tsx`
  - strings trong `Be/prediction/*` neu can.
- Dependency: T011.
- Evidence:
  - Da thay toan bo chuoi UI mojibake bang UTF-8 dung tren `PricePrediction.tsx`.
  - Build FE pass sau cleanup.

### [x] T014 - Danh dau policy cho artifact legacy California (DONE)
- Skill chinh: `software-architecture`
- Muc tieu: quyet dinh giu/bo `housing.csv`, `california_housing_model.pkl`, notebook theory va ghi ro ly do.
- Output:
  - update `prediction-contract-mapping.md` + `REVIEW.md`.
- Dependency: T012.
- Evidence:
  - Da cap nhat contract mapping voi policy artifact legacy:
    - giu artifact California cho muc dich tham chieu/rollback.
    - runtime V6 chi su dung `vietnam.pkl` + fallback `lr_pipeline.joblib`.
  - Da cap nhat `REVIEW.md` de ghi ro quyet dinh va rui ro.

### [x] T016 - Chuan hoa FE error mapping cho serializer error shape (DONE)
- Skill chinh: `typescript-pro`
- Muc tieu:
  - parse duoc ca 2 dang:
    - `{ error: "..." }`
    - `{ error: { field: ["msg"] } }`
  - hien thi message than thien thay vi `[object Object]`.
- Output:
  - `FE/src/pages/PricePrediction.tsx` (error parser helper + UI mapping).
- Dependency: T011.
- Evidence:
  - Da them `normalizeApiErrorMessage(...)`.
  - Catch block da parse object error thanh string than thien.

### [x] T017 - Dong bo fallback formula FE voi BE (DONE)
- Skill chinh: `typescript-pro`
- Muc tieu:
  - fallback local trong FE dung cung range nhu BE:
    - `price_min = 0.88`
    - `price_max = 1.12`
- Output:
  - `FE/src/pages/PricePrediction.tsx`.
- Dependency: T011.
- Evidence:
  - FE fallback da doi `price_max` tu `1.14` -> `1.12`.

## Phase E - Gate Audit Bat Buoc Theo Rule

### [x] T018 - Gate Logic audit (DONE - PASS)
- Skill chinh: `software-architecture`
- Muc tieu:
  - doi chieu contract mapping voi serializer/service/payload FE.
  - xac nhan flow xu ly khong mau thuan.
- Output:
  - cap nhat `plan-006` gate status Logic.
  - cap nhat checklist regression neu phat hien lech logic.
- Evidence:
  - contract BE-FE da sync schema V6.
  - fallback FE da align `price_max = 1.12`.

### [x] T019 - Gate Nghiep vu audit (DONE - PASS)
- Skill chinh: `software-architecture`
- Muc tieu:
  - xac nhan output dung quy tac business (VND, range gia, confidence).
  - xac nhan form FE thu thap dung thong tin nghiep vu V6.
- Output:
  - cap nhat `plan-006` gate status Nghiep vu.
  - cap nhat `prediction-regression-checklist.md` (case C11).
- Evidence:
  - BE tra `estimated_price`, `price_min`, `price_max`, `confidence`, `price_per_m2`.
  - cong thuc range fallback FE da dong bo business rule BE.

### [x] T020 - Gate Security audit (DONE - PASS)
- Skill chinh: `backend-security-coder`
- Muc tieu:
  - check input validation min/range.
  - check error handling khong leak stacktrace/path trong response.
  - check auth/authz impact (neu co) voi endpoint prediction.
- Output:
  - cap nhat `plan-006` gate status Security + risk note trong review.
- Evidence:
  - serializer co `min_value`.
  - view catch exception va tra generic `"Internal server error."`.
  - da bo sung test security cho internal error detail.
  - da smoke C04 model-missing: API tra `500` va khong leak path trong response.

### [x] T021 - Gate Test runtime audit (DONE - PASS)
- Skill chinh: `python-testing-patterns`, `typescript-pro`
- Muc tieu:
  - rerun verify command sau khi cap nhat plan/task.
- Command:
  - `HSW_DB_ENGINE=django.db.backends.sqlite3 python manage.py test prediction`
  - `npm run build`
- Output:
  - pass command output luu trong log session.

### [x] T015 - Cap nhat review memory Plan 006 (DONE)
- Skill chinh: `writing-plans`
- Muc tieu: log day du viec da lam, verify, risk con lai, next steps.
- Output:
  - `tasks-manager/review/REVIEW.md`.
- Dependency: T011 (hoac T014/T016/T017/T018/T019/T020/T021 neu dong full hardening).

