###############################################################
# VotreRadio - Liquidsoap example
# SPDX-License-Identifier: CC0-1.0
#
# Exemple générique :
# - grille hebdomadaire simple ;
# - priorité au DIRECT ;
# - endpoints nowplaying/current-show ;
# - sorties Icecast Opus + MP3.
#
# Remplacez tous les CHANGE_ME avant production.
###############################################################

settings.log.stdout := false
settings.log.level := 3
settings.log.file := true
settings.log.file.path := "/home/votreradio/radio/logs/liquidsoap.log"
settings.log.file.append := true
settings.server.telnet := false

###############################################################
# Sources
###############################################################

library_all = playlist(mode="random", reload=300, "/home/votreradio/Musique")

def mk_pool(path) =
  fallback(track_sensitive=false, [
    playlist(mode="normal", reload=0, path),
    library_all
  ])
end

def mk_dir_pool(path) =
  fallback(track_sensitive=false, [
    playlist(mode="random", reload=0, path),
    library_all
  ])
end

def tag_show(show, kind, is_live, s) =
  metadata.map(
    fun (_) ->
      [
        ("show", show),
        ("show_kind", kind),
        ("show_is_live", is_live)
      ],
    s
  )
end

###############################################################
# Pools musicaux génériques
###############################################################

bloc_nuit        = tag_show("Bloc de nuit", "music_block", "false", mk_pool("/home/votreradio/radio/pools/bloc-nuit.m3u"))
bloc_nuit_endcap = tag_show("Bloc de nuit", "music_block", "false", mk_pool("/home/votreradio/radio/pools/bloc-nuit-endcap.m3u"))
bloc_matin       = tag_show("Bloc du matin", "music_block", "false", mk_pool("/home/votreradio/radio/pools/bloc-matin.m3u"))
bloc_journee     = tag_show("Bloc de journée", "music_block", "false", mk_pool("/home/votreradio/radio/pools/bloc-journee.m3u"))
bloc_soiree      = tag_show("Bloc de soirée", "music_block", "false", mk_pool("/home/votreradio/radio/pools/bloc-soiree.m3u"))
format_court     = tag_show("Format court", "music_block", "false", mk_pool("/home/votreradio/radio/pools/format-court.m3u"))
format_long      = tag_show("Format long", "music_block", "false", mk_pool("/home/votreradio/radio/pools/format-long.m3u"))

###############################################################
# Émissions et habillage
###############################################################

emission_matin = tag_show("Émission du matin", "editorial_event", "false", mk_dir_pool("/home/votreradio/radio/emissions/emission-matin"))
emission_soir = tag_show("Émission du soir", "editorial_event", "false", mk_dir_pool("/home/votreradio/radio/emissions/emission-soir"))
fenetre_archive = tag_show("Archives génériques", "editorial_window", "false", mk_dir_pool("/home/votreradio/radio/emissions/archives"))
jingles = tag_show("Jingle", "dressing", "false", mk_dir_pool("/home/votreradio/radio/jingles"))
annonces = tag_show("Annonce", "dressing", "false", mk_dir_pool("/home/votreradio/radio/annonces"))

###############################################################
# Prédicats horaires
###############################################################

# Ces fenêtres sont volontairement larges : un événement attend la prochaine
# fin de piste et reste éligible pendant une fenêtre cohérente.
p_emission_matin = predicate.once({1w and 10h-11h59})
p_emission_soir = predicate.once({4w and 20h-21h59})
p_archive = predicate.once({7w and 18h-19h59})
p_jingle = predicate.once({00m-14m or 30m-59m})
p_annonce = predicate.once({15m-59m})

###############################################################
# Scheduler
###############################################################

scheduler = switch(track_sensitive=true, [
  # Fenêtres éditoriales génériques
  (p_archive, fenetre_archive),
  (p_emission_matin, emission_matin),
  (p_emission_soir, emission_soir),

  # Habillage
  (p_annonce, annonces),
  (p_jingle, jingles),

  # Grille quotidienne générique
  ({00h-06h30}, bloc_nuit),
  ({06h30-07h}, bloc_nuit_endcap),
  ({07h-12h}, bloc_matin),
  ({12h-18h}, bloc_journee),
  ({18h-24h}, bloc_soiree),

  # Secours
  ({true}, library_all)
])

###############################################################
# Live prioritaire
###############################################################

live = tag_show("DIRECT", "live", "true", input.harbor("live", port=18005, password="CHANGE_ME", icy=true))
program = fallback(track_sensitive=false, [live, scheduler, library_all])
program = fallback(track_sensitive=false, [program, blank()])

###############################################################
# Métadonnées
###############################################################

def md_get(m, key, defv) =
  if list.assoc.mem(key, m) then list.assoc(key, m) else defv end
end

def build_title(m) =
  title = md_get(m, "title", "(sans titre)")
  artist = md_get(m, "artist", "Inconnu")
  album = md_get(m, "album", "")
  year = md_get(m, "date", "")
  composed = "#{artist} - #{title}" ^
    (if album != "" or year != "" then
       " (" ^ (if album != "" then album else "" end) ^
       (if album != "" and year != "" then ", " else "" end) ^
       (if year != "" then year else "" end) ^ ")"
     else "" end)
  [("title", composed)]
end

last_show = ref("")

def push_current_show_map(m) =
  show = md_get(m, "show", "")
  kind = md_get(m, "show_kind", "")
  is_live = md_get(m, "show_is_live", "false")

  if show == "" or kind == "" then
    m
  else
    key = "#{show}|#{kind}|#{is_live}"
    if last_show() != key then
      last_show := key
      q = string.quote
      cmd = "/home/votreradio/radio/scripts/write-current-show-json.py --show " ^ q(show)
            ^ " --kind " ^ q(kind)
            ^ " --is-live " ^ q(is_live)
            ^ " --out /var/www/html/current-show.json"
      ignore(process.run(cmd))
    end
    m
  end
end

last_np = ref("")

def push_nowplaying_map(m) =
  title = md_get(m, "title", "(sans titre)")
  artist_in = md_get(m, "artist", "Inconnu")
  album = md_get(m, "album", "")
  year = md_get(m, "date", "")

  artist = if artist_in == "Inconnu" and string.contains(prefix="DIRECT ", title) then
    "VotreRadio (DIRECT)"
  else
    artist_in
  end

  if title == "(sans titre)" and artist == "Inconnu" then
    m
  else
    key = "#{artist}|#{title}|#{album}|#{year}"
    if last_np() != key then
      last_np := key
      q = string.quote

      cmd1 = "/home/votreradio/radio/scripts/write-nowplaying-json.py --artist " ^ q(artist)
             ^ " --title " ^ q(title)
             ^ " --album " ^ q(album)
             ^ " --year " ^ q(year)
             ^ " --out /var/www/html/nowplaying.json"
      ignore(process.run(cmd1))

      cmd2 = "/home/votreradio/radio/scripts/append-nowplaying-log.py --artist " ^ q(artist)
             ^ " --title " ^ q(title)
             ^ " --album " ^ q(album)
             ^ " --year " ^ q(year)
             ^ " --outdir /var/www/html/history"
      ignore(process.run(cmd2))
    end
    m
  end
end

program = metadata.map(push_current_show_map, program)
program = metadata.map(push_nowplaying_map, program)
program = metadata.map(build_title, program)

###############################################################
# Sorties Icecast
###############################################################

output.icecast(
  %opus(bitrate=96),
  host="localhost",
  port=8000,
  password="CHANGE_ME",
  mount="/stream",
  name="VotreRadio",
  description="Radio libre auto-hébergée",
  genre="Eclectic",
  url="https://votreradio.example",
  program
)

output.icecast(
  %mp3(bitrate=192, stereo=true),
  host="localhost",
  port=8000,
  password="CHANGE_ME",
  mount="/stream.mp3",
  name="VotreRadio (Web)",
  description="Flux web MP3",
  genre="Eclectic",
  url="https://votreradio.example",
  program
)
