async function loadFiles() {
    const response = await fetch("/files", {
        headers: { "Authorization": "Basic " + btoa(":5588") },
    });
    const files = await response.json();

    let fileListHTML = "";
    files.forEach(file => {
        const fileType = file.mimetype.split("/")[0];
        let preview = "";

        // Image Preview
        if (fileType === "image") {
            preview = `<img src="/preview/${file.id}">`;
        }
        // Audio Preview
        else if (fileType === "audio") {
            preview = `<audio controls><source src="/preview/${file.id}" type="${file.mimetype}"></audio>`;
        }
        // Video Preview
        else if (fileType === "video") {
            preview = `<video controls><source src="/preview/${file.id}" type="${file.mimetype}"></video>`;
        }
        // Other Files
        else {
            preview = `<p>📄 ${file.filename}</p>`;
        }

        fileListHTML += `
            <div class="file-item" data-type="${fileType}">
                ${preview}
                <p>${file.filename}</p>
                <a href="/download/${file.id}" class="download-btn">Download</a>
            </div>
        `;
    });

    document.getElementById("fileList").innerHTML = fileListHTML;
}

// File Upload Function
async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    await fetch("/upload", { method: "POST", body: formData });
    loadFiles();
}

// Search Function
function filterFiles() {
    const searchValue = document.getElementById("searchBar").value.toLowerCase();
    const files = document.querySelectorAll(".file-item");

    files.forEach(file => {
        const fileName = file.querySelector("p").innerText.toLowerCase();
        file.style.display = fileName.includes(searchValue) ? "block" : "none";
    });
}

// Category Filter Function
function filterCategory(type) {
    const files = document.querySelectorAll(".file-item");

    files.forEach(file => {
        const fileType = file.getAttribute("data-type");
        file.style.display = (type === "all" || fileType === type) ? "block" : "none";
    });
}

window.onload = loadFiles;
