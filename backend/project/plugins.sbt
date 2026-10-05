//resolvers += "Typesafe repository".at(
//  "https://repo.typesafe.com/typesafe/releases/")

// The Play plugin
addSbtPlugin("org.playframework" % "sbt-plugin" % "3.0.12")

addSbtPlugin("org.scalameta" % "sbt-scalafmt" % "2.6.2")

addSbtPlugin("com.github.sbt" % "sbt-dynver" % "5.1.1")

addSbtPlugin("com.eed3si9n" % "sbt-buildinfo" % "0.13.2")

addSbtPlugin("io.github.play-swagger" % "sbt-play-swagger" % "2.0.6")

addSbtPlugin("com.github.sbt" % "sbt-header" % "5.11.0")

// Docker support
addSbtPlugin("com.github.sbt" % "sbt-native-packager" % "1.12.0")

addDependencyTreePlugin
