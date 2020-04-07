// Foundational imports (React, Redux, etc.)
import React, { useState } from 'react'

// MaterialUI imports
import {
    Popover,
    Card,
    CardHeader,
    CardContent,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse
} from '@material-ui/core'
import CloseIcon from '@material-ui/icons/Close'
import HouseIcon from '@material-ui/icons/House'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
// Local code imports
import useStyles from '../styles'

export const NeighborhoodListItem = ({
        type,
        name,
        permanentId,
        children,
        addHandler=()=>{},
        ...rest
    }) => {
    const classes = useStyles()
    const [open, setOpen] = useState(false)

    if (type === 'ROOM') {
        return <ListItem
            button
            onClick={addHandler(permanentId)}
            {...rest}
        >
            <ListItemIcon>
                <HouseIcon />
            </ListItemIcon>
            <ListItemText primary={name} />
        </ListItem>
    }
    else {
        if (children) {
            return <React.Fragment>
                <ListItem
                    button
                    onClick={() => { setOpen(!open) }}
                    { ...rest }
                >
                    <ListItemIcon>
                        { open ? <ExpandMoreIcon /> : <ChevronRightIcon /> }
                    </ListItemIcon>
                    <ListItemText primary={name} />
                </ListItem>
                <Collapse in={open} timeout="auto">
                    <List component="div" disablePadding>
                        {
                            Object.entries(children)
                                .map(([key, { type, name, permanentId, children }]) => (
                                    <NeighborhoodListItem
                                        key={key}
                                        type={type}
                                        name={name}
                                        permanentId={permanentId}
                                        children={children}
                                        className={classes.nested}
                                        addHandler={addHandler}
                                    />
                                ))
                        }
                    </List>
                </Collapse>
            </React.Fragment>
        }
        else {
            return <ListItem
                    button
                    { ...rest }
                >
                    <ListItemText primary={name} />
                </ListItem>
        }
    }
}

export const RoomSelectPopover = ({ onClose, neighborhoods = {}, addHandler=()=>{}, ...rest }) => {
    const classes = useStyles()
    return <Popover
        anchorOrigin={{
            vertical: 'center',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'center',
            horizontal: 'left',
        }}
        onClose={onClose}
        { ...rest }
    >
        <Card>
            <CardHeader
                title="Select Room"
                className={classes.lightblue}
                action={<IconButton aria-label="close" onClick={onClose}>
                    <CloseIcon />
                </IconButton>}
                titleTypographyProps={{ variant: "overline" }}
            />
            <CardContent>
                <List component="div" disablePadding>
                    {
                        Object.entries(neighborhoods)
                        .map(([key, { type, name, permanentId, children }]) => (
                            <NeighborhoodListItem
                                key={key}
                                type={type}
                                name={name}
                                permanentId={permanentId}
                                children={children}
                                addHandler={addHandler}
                            />
                        ))
                    }
                </List>
            </CardContent>
        </Card>
    </Popover>
}

export default RoomSelectPopover