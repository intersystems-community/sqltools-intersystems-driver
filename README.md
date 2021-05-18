# SQLTools Driver for InterSystems IRIS

## Overview

[InterSystems IRIS](https://www.intersystems.com/products/intersystems-iris/) makes it easier to build high-performance, machine learning-enabled applications that connect data and application silos.

It provides high performance [database management, interoperability, and analytics capabilities](https://www.intersystems.com/products/intersystems-iris/#technology), all built-in from the ground up to speed and simplify your most demanding data-intensive applications.

As a complete, cloud-first data platform, InterSystems IRIS eliminates the need to integrate multiple technologies, resulting in less code, fewer system resources, less maintenance, and higher ROI.

Try out the [SQL QuickStart](https://gettingstarted.intersystems.com/language-quickstarts/sql-quickstart/) and explore more [getting started exercises](https://gettingstarted.intersystems.com).

## Installation

- [Install SQLTools in VS Code from the Marketplace](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools)
- Install the InterSystems extension to SQLTools
  - Install a published version from within VS Code
    - Click on the Extensions icon in your Activity pane
    - Search for SQLTools
    - Find InterSystems and click on Install
  - Or install a beta version
    - [Go to the GitHub releases page](https://github.com/intersystems-community/sqltools-intersystems-driver/releases)
    - Expand Assets triangle for the latest version
    - Download the file ending in `.vsix`
    - Click on the Extensions icon in the Activity pane
    - In the Extensions pane, at the top right, click the "..." menu and select "Install from VSIX..."

## Configuration

- Click the SQLTools icon in the Activity pane (left side of VS Code)  
  ![SQLTools icon in Activity pane](https://raw.githubusercontent.com/intersystems-community/sqltools-intersystems-driver/master/docs/assets/img/activitybar.png)
- If you have no previous database connections, you will see an "Add new connection" button. Click that.  
  ![Add connection button](https://raw.githubusercontent.com/intersystems-community/sqltools-intersystems-driver/master/docs/assets/img/addconnection.png)
- If you already have other connections defined, you won't see the button. Instead, open the command palette (Ctrl/Cmd+Shift+P) and run "SQLTools Management: Add New Connection" ![Add connection from command palette](https://raw.githubusercontent.com/intersystems-community/sqltools-intersystems-driver/master/docs/assets/img/command_palette_add_new.png)
- Click InterSystems IRIS
- Fill out connection information
- Test the connection
- Save the connection

## Use

With a connection defined, you can now write SQL, browse tables, etc.

### To write raw SQL
- Click the "New SQL file" icon
- Write your SQL statement
- Click "Run on active connection"
- Or, select the SQL statement text, and execute it
  - either right-click and select "Run selected query" from the contentual menu
  - or type Command-E, Command-E (Mac)
  - or type Ctrl-E, Ctrl-E (Windows)

### To browse tables

- Click on your connection
- Click on "Tables"
- Right-click on the table of interest
- From the contextual menu, select "Show table records"
