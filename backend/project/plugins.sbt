resolvers += "Typesafe repository".at(
  "https://repo.typesafe.com/typesafe/releases/")

// The Play plugin
addSbtPlugin("com.typesafe.play" % "sbt-plugin" % "2.9.6")

addSbtPlugin("org.scalameta" % "sbt-scalafmt" % "2.5.2")

addSbtPlugin("com.dwijnand" % "sbt-dynver" % "4.1.1")

addSbtPlugin("com.eed3si9n" % "sbt-buildinfo" % "0.13.1")

addSbtPlugin("io.github.play-swagger" % "sbt-play-swagger" % "2.0.4")

addSbtPlugin("de.heikoseeberger" % "sbt-header" % "5.10.0")

addDependencyTreePlugin
