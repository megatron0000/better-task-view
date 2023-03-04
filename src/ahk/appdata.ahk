#Include ..\..\vendor\cjson\cjson.ahk

class AppData
{
    _dirname := ""

    init(dirname)
    {
        this._dirname := dirname

        If (!FileExist(this._dirname))
        {
            FileCreateDir, % A_AppData "\" this._dirname
        }
    }

    Has(key)
    {
        filename := A_AppData "\" this._dirname "\" key ".json"

        return FileExist(filename)
    }

    Load(key, defaultValue)
    {
        filename := A_AppData "\" this._dirname "\" key ".json"

        If (!FileExist(filename))
        {
            Return defaultValue
        }

        FileRead, content, %filename%

        return JSON.Load(content)
    }

    Save(key, value)
    {
        filename := A_AppData "\" this._dirname "\" key ".json"

        encoded := JSON.Dump(value)

        FileDelete, %filename%
        FileAppend, %encoded%, %filename%
    }
}