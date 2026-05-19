(function () {
    "use strict";

    var page = document.querySelector(".jupyter-submit-page");
    if (!page) return;

    var modal = page.querySelector("[data-field-help-modal]");
    var title = page.querySelector("#jupyter-field-help-modal-title");
    var description = page.querySelector("#jupyter-field-help-modal-description");
    var example = page.querySelector("[data-field-help-example]");
    var triggers = Array.from(page.querySelectorAll("[data-field-help]"));
    var opener = null;

    var helpContent = {
        py_module: {
            title: "Python Version",
            description: "Choose the Python module version that should be available in your Jupyter session. Use the default unless your notebook or packages require a newer Python release.",
            example: "If your notebook uses a library that supports Python 3.11 features, choose Python 3.11.13.",
        },
        py_option: {
            title: "Python Source",
            description: "Choose where the session gets Python from. Containers are best for a ready-to-run notebook image, modules use the cluster software stack, and custom Python is for a specific interpreter path.",
            example: "Choose use a container for the standard Jupyter image, or use a custom version of Python when your project has its own Python build.",
        },
        sif_file: {
            title: "Container to use",
            description: "Select the container image that will run Jupyter. A container bundles Python and common tools so your session starts with a consistent software environment.",
            example: "Choose Python 3.13 if your notebook depends on newer Python syntax or packages built for Python 3.13.",
        },
        conda_version: {
            title: "Anaconda Module",
            description: "Select the Anaconda or Miniconda module to load when you use an Anaconda-based Python source. This provides the conda command and base environment tools.",
            example: "Use Miniconda 25.5.1 when you want to activate or create conda environments inside the session.",
        },
        new_conda_env: {
            title: "Create a new conda environment?",
            description: "Turn this on when you want the session setup to create a fresh conda environment instead of using an existing one. This is useful for starting a clean project environment.",
            example: "Check this when you want a new environment for a workshop notebook so installed packages do not affect another project.",
        },
        conda_env: {
            title: "Environment Path",
            description: "Enter the full path to the conda environment you want the session to use or create. Leave it blank if the selected Python source should use its default environment.",
            example: "Use /qfs/people/username/envs/jupyter-lab to point the session at a project-specific environment.",
        },
        modules: {
            title: "Additional Modules",
            description: "List extra cluster modules to load before Jupyter starts. Separate module names with spaces.",
            example: "Enter cuda/12.2 gcc/12.1 if your notebook needs CUDA and a compiler module.",
        },
        py_custom: {
            title: "Python Compiler",
            description: "Provide the full path to a specific Python executable when Python Source is set to use a custom version of Python.",
            example: "Use /qfs/people/username/software/python/bin/python if your project was built with that interpreter.",
        },
        jupyter_config_file: {
            title: "Jupyter Configuration File",
            description: "Provide a custom Jupyter config file if you need special server settings such as extensions, startup behavior, or notebook server options.",
            example: "Use /qfs/people/username/jupyter/jupyter_server_config.py to load a saved server configuration.",
        },
        extra_jupyter_args: {
            title: "Additional Jupyter Arguments",
            description: "Add command-line options that should be passed to Jupyter when the session starts. Separate each argument with a space.",
            example: "Enter --NotebookApp.allow_origin='*' only if your workflow requires that specific Jupyter setting.",
        },
        jupyter_dir: {
            title: "Jupyter Directory",
            description: "Set the folder Jupyter opens when the session starts. Use a project directory so notebooks, data, and outputs are easy to find.",
            example: "Use /qfs/people/username/projects/climate-analysis to open Jupyter directly in that project.",
        },
        slurm_args: {
            title: "Additional Slurm Arguments",
            description: "Add extra Slurm submission options for advanced scheduling needs. Use this only when you know the option is supported by the cluster.",
            example: "Enter --constraint=rome if your job must run on nodes with a specific hardware constraint.",
        },
        env_custom: {
            title: "Custom Environment Script",
            description: "Point to a shell script that prepares your environment before Jupyter starts. This can load modules, activate environments, or export variables.",
            example: "Use /qfs/people/username/project/setup-jupyter.sh to run your project's setup script.",
        },
        load_commands: {
            title: "Setup Commands",
            description: "Enter bash commands to run before Jupyter starts. Use this for short setup steps that do not need a separate script.",
            example: "Use module load cuda/12.2 and source \"$HOME/project_a/setup-env.sh\" on separate lines.",
        },
        preamble_script: {
            title: "Preamble Script",
            description: "Provide a script that should run before the main session launch steps. This is for advanced workflows that need early setup.",
            example: "Use /qfs/people/username/scripts/check-storage.sh to run a pre-launch check before Jupyter starts.",
        },
        config_name: {
            title: "Save Configuration Preset",
            description: "Name this set of form values so you can recognize and reuse the configuration later.",
            example: "Use gpu-pytorch-demo for a preset that launches a GPU notebook with your PyTorch environment.",
        },
    };

    if (!modal || !title || !description || !example || triggers.length === 0) return;

    function getFocusableElements() {
        return Array.from(
            modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(function (element) {
            return !element.disabled && element.offsetParent !== null;
        });
    }

    function openHelp(fieldName, trigger) {
        var content = helpContent[fieldName];
        if (!content) return;

        opener = trigger;
        title.textContent = content.title;
        description.textContent = content.description;
        example.textContent = content.example;
        modal.hidden = false;
        document.body.classList.add("has-field-help-modal");
        trigger.setAttribute("aria-expanded", "true");

        window.setTimeout(function () {
            var focusableElements = getFocusableElements();
            if (focusableElements.length > 0) focusableElements[0].focus();
        }, 0);
    }

    function closeHelp() {
        modal.hidden = true;
        document.body.classList.remove("has-field-help-modal");

        if (opener) {
            opener.setAttribute("aria-expanded", "false");
            opener.focus();
            opener = null;
        }
    }

    triggers.forEach(function (trigger) {
        trigger.setAttribute("aria-haspopup", "dialog");
        trigger.setAttribute("aria-controls", "jupyter-field-help-modal");
        trigger.setAttribute("aria-expanded", "false");

        trigger.addEventListener("click", function () {
            openHelp(trigger.dataset.fieldHelp, trigger);
        });
    });

    modal.querySelectorAll("[data-field-help-close]").forEach(function (closeButton) {
        closeButton.addEventListener("click", closeHelp);
    });

    modal.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeHelp();
            return;
        }

        if (event.key !== "Tab") return;

        var focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        var firstElement = focusableElements[0];
        var lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    });
})();
