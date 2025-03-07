use std::process::Command;

use nom::{
    branch::alt, bytes::complete::take_while1, character::complete::space1, IResult, Parser,
};
use serde::Serialize;

#[derive(Debug, Serialize)]
struct Wifi {
    ssid: String,
    level: i8,
}

// Helper function to parse a single word
fn parse_word(input: &str) -> IResult<&str, &str> {
    take_while1(|c: char| !c.is_whitespace())(input)
}
fn parse_word_and_space(input: &str) -> IResult<&str, &str> {
    alt((space1, parse_word)).parse(input)
}

#[tauri::command]
fn login(wifi: &str, passwd: &str) {
    let output = Command::new("sudo")
        .args(["wpa_cli", "add_network"])
        .output()
        .expect("add_network error");
    let output = String::from_utf8_lossy(&output.stdout);
    let id = output
        .lines()
        .nth(1)
        .unwrap()
        .parse::<u8>()
        .expect("parse id error");
    let _ = Command::new("sudo")
        .args(["wpa_cli", "set_network", &id.to_string(), "ssid", wifi])
        .output()
        .expect("set_network wifi");
    let _ = Command::new("sudo")
        .args(["wpa_cli", "set_network", &id.to_string(), "psk", passwd])
        .output()
        .expect("set_network passwd");
    let _ = Command::new("sudo")
        .args(["wpa_cli", "enable_network", &id.to_string()])
        .output()
        .expect("enable_network error");
}

fn parse_line(input: &str) -> Wifi {
    let (_, (_, _, _, _, level, _, _, _, ssid)) = (
        parse_word,
        space1,
        parse_word,
        space1,
        parse_word,
        space1,
        parse_word,
        space1,
        parse_word_and_space,
    )
        .parse(input)
        .expect("parse lines error");

    Wifi {
        ssid: ssid.to_string(),
        level: level.parse().expect("parse level error"),
    }
}

#[tauri::command]
fn get_ssids() -> Vec<Wifi> {
    let _ = Command::new("sudo")
        .args(["wpa_cli", "scan"])
        .output()
        .expect("scan error");
    // Run the `wpa_cli scan_results` command
    let output = Command::new("sudo")
        .args(["wpa_cli", "scan_results"])
        .output()
        .expect("scan_results error");

    // Convert output bytes to a string
    let output_str = String::from_utf8_lossy(&output.stdout);

    // Process each line, skipping the first one (header)
    let ssids: Vec<Wifi> = output_str
        .lines()
        .skip(2) // Skip header row
        .map(parse_line) // Get the last column (SSID)
        .collect();

    ssids
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_ssids, login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
