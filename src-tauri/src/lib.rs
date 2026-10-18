pub mod commands;
pub mod models;
pub mod security;
pub mod services;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_project,
            open_project,
            list_recent_projects,
            list_project_files,
            read_file_content,
            write_file_content,
            create_file,
            create_directory,
            rename_node,
            delete_node,
            detect_latex_tools,
            get_system_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running LeafForge application");
}
