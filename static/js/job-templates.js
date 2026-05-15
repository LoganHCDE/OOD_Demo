(function () {
    "use strict";

    var page = document.querySelector(".jupyter-submit-page");
    if (!page) return;

    var templateSelect = page.querySelector("#job_template");
    if (!templateSelect) return;

    var presets = {
        "portal-gun-research": {
            fields: {
                job_name: "Portal Gun Research",
                ood_num_hours: "04:00:00",
                "jupyter-job-hours": "4",
                "jupyter-job-minutes": "0",
                bc_num_nodes: "1",
                partition_list: "a100_shared",
                custom_partition: "",
                bc_num_tasks: "2",
                bc_num_cores: "16",
                bc_num_gpus: "1",
                py_module: "python/3.13.5",
                py_option: "3",
                sif_file: "/vast/projects/ops/base_images/jupyter-server.sif",
                conda_version: "python/miniconda25.5.1",
                conda_env: "/qfs/people/demo/envs/portal-gun-research",
                modules: "cuda/12.2 gcc/12.1",
                py_custom: "",
                jupyter_config_file: "",
                extra_jupyter_args: "--NotebookApp.default_url=/lab",
                jupyter_dir: "/qfs/projects/demo/portal-gun-research",
                slurm_args: "--job-name=portal-gun-research",
                env_custom: "",
                load_commands: [
                    "module load cuda/12.2",
                    "export PORTAL_RESEARCH_MODE=trajectory-stabilization",
                    "export APERTURE_TEST_DATA=/qfs/projects/demo/portal-gun-research/data",
                ].join("\n"),
                preamble_script: "",
                config_name: "portal-gun-research-demo",
            },
            checkboxes: {
                new_conda_env: true,
            },
            packages: ["numpy", "scipy", "pytorch"],
        },
        "combine-empire-visualization": {
            fields: {
                job_name: "Combine Empire Visualization",
                ood_num_hours: "02:30:00",
                "jupyter-job-hours": "2",
                "jupyter-job-minutes": "30",
                bc_num_nodes: "2",
                partition_list: "fat_shared",
                custom_partition: "",
                bc_num_tasks: "4",
                bc_num_cores: "12",
                bc_num_gpus: "0",
                py_module: "python/3.13.5",
                py_option: "3",
                sif_file: "/vast/projects/ops/base_images/jupyter-server.sif",
                conda_version: "python/miniconda25.5.1",
                conda_env: "/qfs/people/demo/envs/combine-empire-viz",
                modules: "mesa paraview",
                py_custom: "",
                jupyter_config_file: "",
                extra_jupyter_args: "--NotebookApp.default_url=/lab",
                jupyter_dir: "/qfs/projects/demo/combine-empire-visualization",
                slurm_args: "--job-name=combine-empire-viz",
                env_custom: "",
                load_commands: [
                    "module load mesa",
                    "module load paraview",
                    "export COMBINE_VIS_SCENARIO=city-17",
                ].join("\n"),
                preamble_script: "",
                config_name: "combine-empire-visualization-demo",
            },
            checkboxes: {
                new_conda_env: true,
            },
            packages: ["numpy", "pandas", "matplotlib"],
        },
    };

    function dispatchValueEvents(field) {
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setFieldValue(id, value) {
        var field = page.querySelector("#" + id);
        if (!field) return;

        field.value = value;
        dispatchValueEvents(field);
    }

    function setCheckboxValue(id, checked) {
        var checkbox = page.querySelector("#" + id);
        if (!checkbox) return;

        checkbox.checked = checked;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function setPackages(packageValues) {
        var packageInputs = Array.from(page.querySelectorAll('input[type="checkbox"][name="packages"]'));
        packageInputs.forEach(function (input) {
            input.checked = packageValues.includes(input.value);
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }

    function applyPreset(preset) {
        Object.keys(preset.fields).forEach(function (id) {
            setFieldValue(id, preset.fields[id]);
        });

        Object.keys(preset.checkboxes).forEach(function (id) {
            setCheckboxValue(id, preset.checkboxes[id]);
        });

        setPackages(preset.packages);
    }

    templateSelect.addEventListener("change", function () {
        var preset = presets[templateSelect.value];
        if (!preset) return;

        applyPreset(preset);
    });
})();
