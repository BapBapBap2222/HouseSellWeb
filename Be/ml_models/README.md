Runtime model artifacts used by the Django backend.

The prediction API loads model files from this directory so the backend can be
deployed as a standalone repository without depending on the root-level
`LinearRegressionModel` training folder.

Required files:

- `vietnam.pkl`
- `lr_pipeline.joblib`
- `vietnam_metadata.json`
- `lr_pipeline_metrics.json`
