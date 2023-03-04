#Include ..\..\vendor\livethumb\livethumb.ahk

class Thumbnail
{
    create(sourceWindowHandle, destinationWindowHandle, sourcePosition, destinationPosition)
    {
        return new Thumbnail(sourceWindowHandle, destinationWindowHandle, sourcePosition, destinationPosition)
    }

    __New(sourceWindowHandle, destinationWindowHandle, sourcePosition, destinationPosition)
    {
        this._thumb := new LiveThumb(sourceWindowHandle, destinationWindowHandle)

        if (sourcePosition)
        {
            this._thumb.Source := sourcePosition
        }

        this.SetDestination(destinationPosition)
    }

    SetDestination(destinationPosition)
    {
        this._thumb.Destination := [destinationPosition.left, destinationPosition.top, destinationPosition.right, destinationPosition.bottom]
    }

    Show()
    {
        this._thumb.Visible := True
        this._thumb.Update()
    }

    Destroy()
    {
        this._thumb.Visible := False
        this._thumb.Update()
        this._thumb := null
    }
}