{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 8,
      "minor": 6,
      "revision": 0,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [80.0, 80.0, 980.0, 720.0],
    "boxes": [
      {
        "box": {
          "id": "obj-title",
          "maxclass": "comment",
          "patching_rect": [20.0, 12.0, 520.0, 22.0],
          "text": "Jazz Gen link — stock Max OSC/UDP. Match ports with Settings → Max link.",
          "fontsize": 13.0
        }
      },
      {
        "box": {
          "id": "obj-rx",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [20.0, 48.0, 121.0, 22.0],
          "text": "udpreceive 4377"
        }
      },
      {
        "box": {
          "id": "obj-route",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 16,
          "outlettype": ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
          "patching_rect": [20.0, 80.0, 900.0, 22.0],
          "text": "route /jazzgen/hello /jazzgen/config/tempo /jazzgen/config/soloInstrument /jazzgen/config/soloStyle /jazzgen/config/turnOrder /jazzgen/config/tradeMode /jazzgen/config/backingStyle /jazzgen/config/presetId /jazzgen/session/state /jazzgen/soloist/note /jazzgen/backing/note /jazzgen/config/band/upright_bass /jazzgen/config/band/drums /jazzgen/config/band/piano /jazzgen/config/renderMode"
        }
      },
      {
        "box": {
          "id": "obj-tx",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [20.0, 640.0, 168.0, 22.0],
          "text": "udpsend 127.0.0.1 4378"
        }
      },
      {
        "box": {
          "id": "obj-hello-btn",
          "maxclass": "button",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": ["bang"],
          "patching_rect": [20.0, 600.0, 24.0, 24.0]
        }
      },
      {
        "box": {
          "id": "obj-hello-msg",
          "maxclass": "message",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [52.0, 602.0, 90.0, 22.0],
          "text": "/jazzgen/hello max"
        }
      },
      {
        "box": {
          "id": "obj-loadbang",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": ["bang"],
          "patching_rect": [160.0, 600.0, 66.0, 22.0],
          "text": "loadbang"
        }
      },
      {
        "box": {
          "id": "obj-cfg-label",
          "maxclass": "comment",
          "patching_rect": [20.0, 120.0, 200.0, 20.0],
          "text": "CONFIG (mirrors web Session setup — not the chart strip)"
        }
      },
      {
        "box": {
          "id": "obj-tempo-label",
          "maxclass": "comment",
          "patching_rect": [20.0, 148.0, 50.0, 20.0],
          "text": "tempo"
        }
      },
      {
        "box": {
          "id": "obj-tempo",
          "maxclass": "number",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": ["", "bang"],
          "parameter_enable": 0,
          "patching_rect": [70.0, 146.0, 50.0, 22.0],
          "minimum": 40,
          "maximum": 300
        }
      },
      {
        "box": {
          "id": "obj-tempo-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [70.0, 176.0, 168.0, 22.0],
          "text": "prepend /jazzgen/config/tempo"
        }
      },
      {
        "box": {
          "id": "obj-inst-label",
          "maxclass": "comment",
          "patching_rect": [260.0, 148.0, 80.0, 20.0],
          "text": "solo inst"
        }
      },
      {
        "box": {
          "id": "obj-inst",
          "maxclass": "umenu",
          "items": ["trumpet", ",", "alto_sax", ",", "tenor_sax", ",", "piano", ",", "guitar"],
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": ["int", "", ""],
          "parameter_enable": 0,
          "patching_rect": [340.0, 146.0, 120.0, 22.0]
        }
      },
      {
        "box": {
          "id": "obj-inst-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [340.0, 176.0, 220.0, 22.0],
          "text": "prepend /jazzgen/config/soloInstrument"
        }
      },
      {
        "box": {
          "id": "obj-style-label",
          "maxclass": "comment",
          "patching_rect": [20.0, 214.0, 50.0, 20.0],
          "text": "style"
        }
      },
      {
        "box": {
          "id": "obj-style",
          "maxclass": "umenu",
          "items": ["bebop", ",", "lyrical", ",", "outside"],
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": ["int", "", ""],
          "parameter_enable": 0,
          "patching_rect": [70.0, 212.0, 100.0, 22.0]
        }
      },
      {
        "box": {
          "id": "obj-style-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [70.0, 242.0, 200.0, 22.0],
          "text": "prepend /jazzgen/config/soloStyle"
        }
      },
      {
        "box": {
          "id": "obj-turn-label",
          "maxclass": "comment",
          "patching_rect": [290.0, 214.0, 70.0, 20.0],
          "text": "who starts"
        }
      },
      {
        "box": {
          "id": "obj-turn",
          "maxclass": "umenu",
          "items": ["soloist_first", ",", "player_first"],
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": ["int", "", ""],
          "parameter_enable": 0,
          "patching_rect": [360.0, 212.0, 130.0, 22.0]
        }
      },
      {
        "box": {
          "id": "obj-turn-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [360.0, 242.0, 210.0, 22.0],
          "text": "prepend /jazzgen/config/turnOrder"
        }
      },
      {
        "box": {
          "id": "obj-trade-label",
          "maxclass": "comment",
          "patching_rect": [20.0, 280.0, 50.0, 20.0],
          "text": "trade"
        }
      },
      {
        "box": {
          "id": "obj-trade",
          "maxclass": "umenu",
          "items": ["auto", ",", "phrase", ",", "chorus"],
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": ["int", "", ""],
          "parameter_enable": 0,
          "patching_rect": [70.0, 278.0, 100.0, 22.0]
        }
      },
      {
        "box": {
          "id": "obj-trade-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [70.0, 308.0, 210.0, 22.0],
          "text": "prepend /jazzgen/config/tradeMode"
        }
      },
      {
        "box": {
          "id": "obj-feel-label",
          "maxclass": "comment",
          "patching_rect": [300.0, 280.0, 40.0, 20.0],
          "text": "feel"
        }
      },
      {
        "box": {
          "id": "obj-feel",
          "maxclass": "umenu",
          "items": ["bebop", ",", "swing", ",", "latin", ",", "bossa_nova", ",", "straight"],
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": ["int", "", ""],
          "parameter_enable": 0,
          "patching_rect": [340.0, 278.0, 120.0, 22.0]
        }
      },
      {
        "box": {
          "id": "obj-feel-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [340.0, 308.0, 220.0, 22.0],
          "text": "prepend /jazzgen/config/backingStyle"
        }
      },
      {
        "box": {
          "id": "obj-state-label",
          "maxclass": "comment",
          "patching_rect": [20.0, 350.0, 300.0, 20.0],
          "text": "SESSION STATE (phase chorus bpm bar beat totalBeat top activePlayer)"
        }
      },
      {
        "box": {
          "id": "obj-state-print",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [20.0, 374.0, 141.0, 22.0],
          "text": "print jazzgen-state"
        }
      },
      {
        "box": {
          "id": "obj-note-label",
          "maxclass": "comment",
          "patching_rect": [20.0, 410.0, 280.0, 20.0],
          "text": "SOLOIST / BAND NOTES → simple MIDI out (pitch vel startBeat dur)"
        }
      },
      {
        "box": {
          "id": "obj-unpack-note",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 4,
          "outlettype": ["", "", "", ""],
          "patching_rect": [20.0, 434.0, 89.0, 22.0],
          "text": "unpack 0 0 0. 0."
        }
      },
      {
        "box": {
          "id": "obj-makenote",
          "maxclass": "newobj",
          "numinlets": 3,
          "numoutlets": 2,
          "outlettype": ["int", "int"],
          "patching_rect": [20.0, 466.0, 89.0, 22.0],
          "text": "makenote 100 200"
        }
      },
      {
        "box": {
          "id": "obj-noteout",
          "maxclass": "newobj",
          "numinlets": 3,
          "numoutlets": 0,
          "patching_rect": [20.0, 498.0, 52.0, 22.0],
          "text": "noteout"
        }
      },
      {
        "box": {
          "id": "obj-midi-label",
          "maxclass": "comment",
          "patching_rect": [520.0, 410.0, 280.0, 20.0],
          "text": "HARDWARE IN → Jazz Gen player buffer (during player_solo)"
        }
      },
      {
        "box": {
          "id": "obj-midiin",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": ["int"],
          "patching_rect": [520.0, 434.0, 46.0, 22.0],
          "text": "midiin"
        }
      },
      {
        "box": {
          "id": "obj-midiparse",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 8,
          "outlettype": ["int", "int", "int", "int", "int", "int", "int", "int"],
          "patching_rect": [520.0, 466.0, 148.0, 22.0],
          "text": "midiparse"
        }
      },
      {
        "box": {
          "id": "obj-pack-on",
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [520.0, 498.0, 55.0, 22.0],
          "text": "pack 0 0"
        }
      },
      {
        "box": {
          "id": "obj-on-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [520.0, 530.0, 175.0, 22.0],
          "text": "prepend /jazzgen/midi/noteon"
        }
      },
      {
        "box": {
          "id": "obj-off-pre",
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [""],
          "patching_rect": [720.0, 530.0, 175.0, 22.0],
          "text": "prepend /jazzgen/midi/noteoff"
        }
      },
      {
        "box": {
          "id": "obj-connected",
          "maxclass": "led",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": ["int"],
          "patching_rect": [200.0, 48.0, 24.0, 24.0]
        }
      },
      {
        "box": {
          "id": "obj-connected-label",
          "maxclass": "comment",
          "patching_rect": [232.0, 50.0, 80.0, 20.0],
          "text": "hello in"
        }
      }
    ],
    "lines": [
      { "patchline": { "source": ["obj-rx", 0], "destination": ["obj-route", 0] } },
      { "patchline": { "source": ["obj-route", 0], "destination": ["obj-connected", 0] } },
      { "patchline": { "source": ["obj-route", 1], "destination": ["obj-tempo", 0] } },
      { "patchline": { "source": ["obj-route", 2], "destination": ["obj-inst", 0] } },
      { "patchline": { "source": ["obj-route", 3], "destination": ["obj-style", 0] } },
      { "patchline": { "source": ["obj-route", 4], "destination": ["obj-turn", 0] } },
      { "patchline": { "source": ["obj-route", 5], "destination": ["obj-trade", 0] } },
      { "patchline": { "source": ["obj-route", 6], "destination": ["obj-feel", 0] } },
      { "patchline": { "source": ["obj-route", 8], "destination": ["obj-state-print", 0] } },
      { "patchline": { "source": ["obj-route", 9], "destination": ["obj-unpack-note", 0] } },
      { "patchline": { "source": ["obj-tempo", 0], "destination": ["obj-tempo-pre", 0] } },
      { "patchline": { "source": ["obj-tempo-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-inst", 1], "destination": ["obj-inst-pre", 0] } },
      { "patchline": { "source": ["obj-inst-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-style", 1], "destination": ["obj-style-pre", 0] } },
      { "patchline": { "source": ["obj-style-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-turn", 1], "destination": ["obj-turn-pre", 0] } },
      { "patchline": { "source": ["obj-turn-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-trade", 1], "destination": ["obj-trade-pre", 0] } },
      { "patchline": { "source": ["obj-trade-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-feel", 1], "destination": ["obj-feel-pre", 0] } },
      { "patchline": { "source": ["obj-feel-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-unpack-note", 0], "destination": ["obj-makenote", 0] } },
      { "patchline": { "source": ["obj-unpack-note", 1], "destination": ["obj-makenote", 1] } },
      { "patchline": { "source": ["obj-makenote", 0], "destination": ["obj-noteout", 0] } },
      { "patchline": { "source": ["obj-makenote", 1], "destination": ["obj-noteout", 1] } },
      { "patchline": { "source": ["obj-midiin", 0], "destination": ["obj-midiparse", 0] } },
      { "patchline": { "source": ["obj-midiparse", 0], "destination": ["obj-pack-on", 0] } },
      { "patchline": { "source": ["obj-midiparse", 1], "destination": ["obj-pack-on", 1] } },
      { "patchline": { "source": ["obj-pack-on", 0], "destination": ["obj-on-pre", 0] } },
      { "patchline": { "source": ["obj-on-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-off-pre", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-hello-btn", 0], "destination": ["obj-hello-msg", 0] } },
      { "patchline": { "source": ["obj-hello-msg", 0], "destination": ["obj-tx", 0] } },
      { "patchline": { "source": ["obj-loadbang", 0], "destination": ["obj-hello-msg", 0] } }
    ]
  }
}
